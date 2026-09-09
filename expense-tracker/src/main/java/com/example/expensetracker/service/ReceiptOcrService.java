package com.example.expensetracker.service;

import com.example.expensetracker.dto.ReceiptScanDto;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.awt.image.RescaleOp;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReceiptOcrService {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptOcrService.class);

    public ReceiptScanDto scanReceipt(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return new ReceiptScanDto(null, null, LocalDate.now(), "Other", "", 0.0, false, "Uploaded receipt image is empty");
        }

        String rawText = "";
        boolean ocrSuccess = false;

        try {
            InputStream is = file.getInputStream();
            BufferedImage originalImage = ImageIO.read(is);
            if (originalImage != null) {
                // Preprocess image (Grayscale, Contrast & Scaling) to optimize OCR accuracy
                BufferedImage processedImage = preprocessImage(originalImage);

                ITesseract tesseract = new Tesseract();
                String tessDataPath = System.getenv("TESSDATA_PREFIX");
                if (tessDataPath != null && !tessDataPath.trim().isEmpty()) {
                    tesseract.setDatapath(tessDataPath.trim());
                }

                rawText = tesseract.doOCR(processedImage);
                if (rawText != null && !rawText.trim().isEmpty()) {
                    ocrSuccess = true;
                } else {
                    // Try OCR on original image if processed image produced empty result
                    rawText = tesseract.doOCR(originalImage);
                    ocrSuccess = rawText != null && !rawText.trim().isEmpty();
                }
            }
        } catch (Throwable t) {
            logger.warn("Tess4J OCR execution unavailable or failed: {}. Utilizing heuristic text parsing.", t.getMessage());
        }

        if (rawText == null || rawText.trim().isEmpty()) {
            rawText = "Receipt image processed (" + file.getOriginalFilename() + ")";
        }

        return parseReceiptText(rawText, ocrSuccess);
    }

    /**
     * Image Preprocessing pipeline:
     * 1. Scaling small images for better glyph resolution.
     * 2. Grayscale conversion.
     * 3. Contrast adjustment.
     */
    private BufferedImage preprocessImage(BufferedImage img) {
        try {
            int width = img.getWidth();
            int height = img.getHeight();

            // Upscale if small image (< 1000px width)
            if (width < 1000) {
                int newWidth = width * 2;
                int newHeight = height * 2;
                BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_BYTE_GRAY);
                Graphics2D g = resized.createGraphics();
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g.drawImage(img, 0, 0, newWidth, newHeight, null);
                g.dispose();
                img = resized;
            } else {
                // Convert to Grayscale
                BufferedImage grayscale = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
                Graphics2D g = grayscale.createGraphics();
                g.drawImage(img, 0, 0, null);
                g.dispose();
                img = grayscale;
            }

            // Contrast enhancement (RescaleOp: scale factor 1.25, offset 10)
            RescaleOp rescaleOp = new RescaleOp(1.25f, 10.0f, null);
            return rescaleOp.filter(img, null);
        } catch (Exception e) {
            logger.debug("Image preprocessing skipped due to: {}", e.getMessage());
            return img;
        }
    }

    public ReceiptScanDto parseReceiptText(String rawText, boolean ocrSuccess) {
        BigDecimal extractedAmount = extractTotalAmount(rawText);
        String merchantName = extractMerchantName(rawText);
        LocalDate date = extractDate(rawText);
        String category = guessCategory(rawText, merchantName);

        boolean amountDetected = (extractedAmount != null && extractedAmount.compareTo(BigDecimal.ZERO) > 0);
        boolean merchantDetected = (merchantName != null && !merchantName.trim().isEmpty());

        String message;
        if (amountDetected && merchantDetected) {
            message = "Receipt scanned successfully.";
        } else if (amountDetected) {
            message = "Total amount extracted. Please verify merchant details.";
        } else if (merchantDetected) {
            message = "Merchant extracted. Could not confidently detect total amount. Please enter manually.";
        } else {
            message = "Could not confidently detect total amount or merchant. Please enter details manually.";
        }

        return new ReceiptScanDto(
                extractedAmount,
                merchantName,
                date,
                category,
                rawText.trim(),
                ocrSuccess ? 0.90 : 0.50,
                amountDetected || merchantDetected,
                message
        );
    }

    private BigDecimal extractTotalAmount(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        // 1. Priority: Match Explicit Grand Total / Total Amount / Amount Payable / Net Total labels
        Pattern grandTotalPattern = Pattern.compile(
                "(?i)(?:grand\\s+total|total\\s+amount|amount\\s+payable|net\\s+total|net\\s+amount|balance\\s+due|amount\\s+due|total\\s+payable|to\\s+pay|final\\s+total)\\D*?([₹$€£]|rs\\.?|inr\\.?)?\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = grandTotalPattern.matcher(text);
        List<BigDecimal> highPriorityAmounts = new ArrayList<>();

        while (matcher.find()) {
            String numGroup = matcher.group(2);
            if (numGroup != null && !numGroup.isEmpty()) {
                String cleanNum = numGroup.replaceAll("[^0-9\\.]", "");
                try {
                    BigDecimal bd = new BigDecimal(cleanNum);
                    if (bd.compareTo(BigDecimal.ZERO) > 0) {
                        highPriorityAmounts.add(bd);
                    }
                } catch (Exception ignored) {}
            }
        }

        if (!highPriorityAmounts.isEmpty()) {
            return highPriorityAmounts.stream().max(BigDecimal::compareTo).orElse(null);
        }

        // 2. Secondary: Match general "TOTAL" keyword
        Pattern generalTotalPattern = Pattern.compile(
                "(?i)(?:total|sum|amt|amount)\\D*?([₹$€£]|rs\\.?|inr\\.?)?\\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher genMatcher = generalTotalPattern.matcher(text);
        List<BigDecimal> genAmounts = new ArrayList<>();

        while (genMatcher.find()) {
            String numGroup = genMatcher.group(2);
            if (numGroup != null && !numGroup.isEmpty()) {
                String cleanNum = numGroup.replaceAll("[^0-9\\.]", "");
                try {
                    BigDecimal bd = new BigDecimal(cleanNum);
                    if (bd.compareTo(BigDecimal.ZERO) > 0) {
                        genAmounts.add(bd);
                    }
                } catch (Exception ignored) {}
            }
        }

        if (!genAmounts.isEmpty()) {
            return genAmounts.stream().max(BigDecimal::compareTo).orElse(null);
        }

        // 3. Fallback: Standalone currency numbers (e.g. ₹499.90, Rs. 450.00, INR 1250)
        Pattern standalonePattern = Pattern.compile("(?:^|\\s)(?:[₹$€£]|rs\\.?|inr\\.?)?\\s*([0-9]{1,3}(?:,[0-9]{3})*\\.[0-9]{2}|[0-9]+\\.[0-9]{2})(?:\\s|$)", Pattern.MULTILINE | Pattern.CASE_INSENSITIVE);
        Matcher numMatcher = standalonePattern.matcher(text);
        List<BigDecimal> standaloneAmounts = new ArrayList<>();

        while (numMatcher.find()) {
            try {
                String cleanNum = numMatcher.group(1).replaceAll("[^0-9\\.]", "");
                BigDecimal bd = new BigDecimal(cleanNum);
                if (bd.compareTo(BigDecimal.ZERO) > 0) {
                    standaloneAmounts.add(bd);
                }
            } catch (Exception ignored) {}
        }

        if (!standaloneAmounts.isEmpty()) {
            return standaloneAmounts.stream().max(BigDecimal::compareTo).orElse(null);
        }

        // Return null if amount cannot be detected with confidence (never return 0)
        return null;
    }

    private String extractMerchantName(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        String[] lines = text.split("\\r?\\n");
        for (int i = 0; i < Math.min(lines.length, 10); i++) {
            String trimmed = lines[i].trim();
            if (trimmed.length() < 3) continue;

            String lower = trimmed.toLowerCase(Locale.ENGLISH);
            // Skip generic receipt header noise
            if (lower.contains("receipt") || lower.contains("tax invoice") || lower.contains("welcome") ||
                lower.contains("cash memo") || lower.contains("customer copy") || lower.contains("date") ||
                lower.contains("tel:") || lower.contains("phone") || lower.contains("gst") || lower.contains("gstin") ||
                lower.contains("thank you") || lower.contains("bill no") || lower.contains("order no") ||
                lower.contains("invoice") || lower.contains("original copy") || lower.contains("duplicate")) {
                continue;
            }

            String cleanName = trimmed.replaceAll("[^a-zA-Z0-9\\s&'-]", "").trim();
            if (cleanName.length() >= 3) {
                return cleanName;
            }
        }
        // Return null if merchant cannot be extracted (never return fake "Store Purchase")
        return null;
    }

    private LocalDate extractDate(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        // European / Indian format (DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY)
        Pattern eurPattern = Pattern.compile("\\b(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})\\b");
        Matcher eurMatcher = eurPattern.matcher(text);
        if (eurMatcher.find()) {
            try {
                int d = Integer.parseInt(eurMatcher.group(1));
                int m = Integer.parseInt(eurMatcher.group(2));
                int y = Integer.parseInt(eurMatcher.group(3));
                if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
                    return LocalDate.of(y, m, d);
                }
            } catch (Exception ignored) {}
        }

        // ISO format (YYYY-MM-DD)
        Pattern isoPattern = Pattern.compile("\\b(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})\\b");
        Matcher isoMatcher = isoPattern.matcher(text);
        if (isoMatcher.find()) {
            try {
                int y = Integer.parseInt(isoMatcher.group(1));
                int m = Integer.parseInt(isoMatcher.group(2));
                int d = Integer.parseInt(isoMatcher.group(3));
                if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
                    return LocalDate.of(y, m, d);
                }
            } catch (Exception ignored) {}
        }

        // Textual format: "09 Sep 2026" or "09-Sep-2026"
        Pattern textDatePattern1 = Pattern.compile("(?i)\\b(\\d{1,2})[\\s/-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s/-]+(\\d{4})\\b");
        Matcher textMatcher1 = textDatePattern1.matcher(text);
        if (textMatcher1.find()) {
            try {
                int d = Integer.parseInt(textMatcher1.group(1));
                String monthStr = textMatcher1.group(2).toLowerCase(Locale.ENGLISH);
                int y = Integer.parseInt(textMatcher1.group(3));
                int m = parseMonthName(monthStr);
                if (m > 0) return LocalDate.of(y, m, d);
            } catch (Exception ignored) {}
        }

        // Textual format: "September 9, 2026" or "Sep 9 2026"
        Pattern textDatePattern2 = Pattern.compile("(?i)\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s/-]+(\\d{1,2}),?[\\s/-]+(\\d{4})\\b");
        Matcher textMatcher2 = textDatePattern2.matcher(text);
        if (textMatcher2.find()) {
            try {
                String monthStr = textMatcher2.group(1).toLowerCase(Locale.ENGLISH);
                int d = Integer.parseInt(textMatcher2.group(2));
                int y = Integer.parseInt(textMatcher2.group(3));
                int m = parseMonthName(monthStr);
                if (m > 0) return LocalDate.of(y, m, d);
            } catch (Exception ignored) {}
        }

        // Return null if date cannot be extracted (never silently default to today's date)
        return null;
    }

    private int parseMonthName(String month) {
        if (month.startsWith("jan")) return 1;
        if (month.startsWith("feb")) return 2;
        if (month.startsWith("mar")) return 3;
        if (month.startsWith("apr")) return 4;
        if (month.startsWith("may")) return 5;
        if (month.startsWith("jun")) return 6;
        if (month.startsWith("jul")) return 7;
        if (month.startsWith("aug")) return 8;
        if (month.startsWith("sep")) return 9;
        if (month.startsWith("oct")) return 10;
        if (month.startsWith("nov")) return 11;
        if (month.startsWith("dec")) return 12;
        return 0;
    }

    private String guessCategory(String text, String merchantName) {
        String combined = ((text != null ? text : "") + " " + (merchantName != null ? merchantName : "")).toLowerCase(Locale.ENGLISH);

        if (combined.contains("restaurant") || combined.contains("cafe") || combined.contains("coffee") ||
            combined.contains("mcdonald") || combined.contains("burger") || combined.contains("pizza") ||
            combined.contains("bakery") || combined.contains("food") || combined.contains("dining") ||
            combined.contains("swiggy") || combined.contains("zomato") || combined.contains("dominos") ||
            combined.contains("kfc") || combined.contains("starbucks") || combined.contains("diner") ||
            combined.contains("biryani") || combined.contains("hotel") || combined.contains("kitchen") || combined.contains("mess")) {
            return "Food";
        }

        if (combined.contains("uber") || combined.contains("ola") || combined.contains("taxi") ||
            combined.contains("fuel") || combined.contains("petrol") || combined.contains("diesel") ||
            combined.contains("shell") || combined.contains("hp") || combined.contains("iocl") || combined.contains("bpcl") ||
            combined.contains("metro") || combined.contains("parking") || combined.contains("bus") ||
            combined.contains("toll") || combined.contains("flight") || combined.contains("railway") ||
            combined.contains("auto") || combined.contains("irctc")) {
            return "Transport";
        }

        if (combined.contains("amazon") || combined.contains("flipkart") || combined.contains("myntra") ||
            combined.contains("walmart") || combined.contains("target") || combined.contains("supermarket") ||
            combined.contains("store") || combined.contains("apparel") || combined.contains("fashion") ||
            combined.contains("mall") || combined.contains("retail") || combined.contains("clothing") ||
            combined.contains("dmart") || combined.contains("reliance") || combined.contains("bigbasket") ||
            combined.contains("grocery") || combined.contains("spencers")) {
            return "Shopping";
        }

        if (combined.contains("pharmacy") || combined.contains("chemist") || combined.contains("hospital") ||
            combined.contains("clinic") || combined.contains("doctor") || combined.contains("medical") ||
            combined.contains("health") || combined.contains("apollo") || combined.contains("medplus") ||
            combined.contains("diagnostics") || combined.contains("wellness")) {
            return "Healthcare";
        }

        if (combined.contains("electricity") || combined.contains("water") || combined.contains("internet") ||
            combined.contains("wifi") || combined.contains("airtel") || combined.contains("jio") || combined.contains("vi") ||
            combined.contains("utility") || combined.contains("bill") || combined.contains("recharge") || combined.contains("gas")) {
            return "Bills";
        }

        if (combined.contains("school") || combined.contains("college") || combined.contains("tuition") ||
            combined.contains("book") || combined.contains("university") || combined.contains("udemy") ||
            combined.contains("coursera") || combined.contains("education")) {
            return "Education";
        }

        if (combined.contains("cinema") || combined.contains("movie") || combined.contains("pvr") ||
            combined.contains("inox") || combined.contains("theater") || combined.contains("event") ||
            combined.contains("ticket") || combined.contains("game") || combined.contains("netflix") ||
            combined.contains("hotstar")) {
            return "Entertainment";
        }

        if (combined.contains("rent") || combined.contains("deposit")) {
            return "Rent";
        }

        // Return Other for unrecognized receipts (never default to Shopping or Food)
        return "Other";
    }
}
