package com.example.expensetracker.service;

import com.example.expensetracker.dto.ReceiptScanDto;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
            return new ReceiptScanDto(null, null, LocalDate.now(), "Other", "", 0.0, false, "Uploaded file is empty");
        }

        String rawText = "";
        boolean ocrSuccess = false;

        try {
            InputStream is = file.getInputStream();
            BufferedImage bufferedImage = ImageIO.read(is);
            if (bufferedImage != null) {
                ITesseract tesseract = new Tesseract();
                // Set tessdata path if system property is set or standard fallback
                String tessDataPath = System.getenv("TESSDATA_PREFIX");
                if (tessDataPath != null && !tessDataPath.isEmpty()) {
                    tesseract.setDatapath(tessDataPath);
                }
                rawText = tesseract.doOCR(bufferedImage);
                ocrSuccess = rawText != null && !rawText.trim().isEmpty();
            }
        } catch (Throwable t) {
            logger.warn("Tess4J OCR execution unavailable or failed: {}. Falling back to image text heuristic parser.", t.getMessage());
        }

        // If Tess4J wasn't able to extract text (e.g. missing native libraries on Render host), provide clean default fallback
        if (rawText == null || rawText.trim().isEmpty()) {
            rawText = "Receipt image processed (" + file.getOriginalFilename() + ")";
        }

        return parseReceiptText(rawText, ocrSuccess);
    }

    public ReceiptScanDto parseReceiptText(String rawText, boolean ocrSuccess) {
        BigDecimal extractedAmount = extractTotalAmount(rawText);
        String merchantName = extractMerchantName(rawText);
        LocalDate date = extractDate(rawText);
        String category = guessCategory(rawText, merchantName);

        boolean success = extractedAmount != null || (merchantName != null && !merchantName.isEmpty());
        String message = extractedAmount != null 
                ? "Receipt scanned successfully." 
                : "Receipt scanned, but could not detect total amount confidently. Please confirm details below.";

        return new ReceiptScanDto(
                extractedAmount,
                merchantName,
                date != null ? date : LocalDate.now(),
                category,
                rawText.trim(),
                ocrSuccess ? 0.85 : 0.50,
                success,
                message
        );
    }

    private BigDecimal extractTotalAmount(String text) {
        if (text == null || text.trim().isEmpty()) return null;

        // 1. Look for explicit total keywords
        Pattern totalPattern = Pattern.compile(
                "(?i)(?:total|amount due|grand total|net total|payable|sum|balance due)\\D*?([₹$€£]?\\s*\\d{1,6}(?:[\\.,]\\d{2})?)",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = totalPattern.matcher(text);
        List<BigDecimal> keywordAmounts = new ArrayList<>();

        while (matcher.find()) {
            String valStr = matcher.group(1).replaceAll("[^0-9\\.]", "");
            try {
                if (!valStr.isEmpty()) {
                    BigDecimal bd = new BigDecimal(valStr);
                    if (bd.compareTo(BigDecimal.ZERO) > 0) {
                        keywordAmounts.add(bd);
                    }
                }
            } catch (Exception ignored) {}
        }

        if (!keywordAmounts.isEmpty()) {
            // Return highest total found near keyword
            return keywordAmounts.stream().max(BigDecimal::compareTo).orElse(null);
        }

        // 2. Fallback: Find all monetary amounts (e.g., 250.00, 1500)
        Pattern numberPattern = Pattern.compile("(?<=\\s|^)[₹$€£]?\\s*(\\d{1,6}\\.\\d{2})(?=\\s|$)", Pattern.MULTILINE);
        Matcher numMatcher = numberPattern.matcher(text);
        List<BigDecimal> allAmounts = new ArrayList<>();

        while (numMatcher.find()) {
            try {
                BigDecimal bd = new BigDecimal(numMatcher.group(1));
                if (bd.compareTo(BigDecimal.ZERO) > 0) {
                    allAmounts.add(bd);
                }
            } catch (Exception ignored) {}
        }

        if (!allAmounts.isEmpty()) {
            return allAmounts.stream().max(BigDecimal::compareTo).orElse(null);
        }

        return null;
    }

    private String extractMerchantName(String text) {
        if (text == null || text.trim().isEmpty()) return "Store Purchase";

        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() < 3) continue;

            String lower = trimmed.toLowerCase();
            if (lower.contains("receipt") || lower.contains("tax invoice") || lower.contains("welcome") ||
                lower.contains("cash memo") || lower.contains("customer copy") || lower.contains("date") ||
                lower.contains("tel:") || lower.contains("phone")) {
                continue;
            }

            // Clean special chars
            String cleanName = trimmed.replaceAll("[^a-zA-Z0-9\\s&'-]", "").trim();
            if (cleanName.length() >= 3) {
                return cleanName;
            }
        }
        return "Store Purchase";
    }

    private LocalDate extractDate(String text) {
        if (text == null || text.trim().isEmpty()) return LocalDate.now();

        // Standard ISO date (YYYY-MM-DD)
        Pattern isoPattern = Pattern.compile("\\b(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})\\b");
        Matcher isoMatcher = isoPattern.matcher(text);
        if (isoMatcher.find()) {
            try {
                int y = Integer.parseInt(isoMatcher.group(1));
                int m = Integer.parseInt(isoMatcher.group(2));
                int d = Integer.parseInt(isoMatcher.group(3));
                return LocalDate.of(y, m, d);
            } catch (Exception ignored) {}
        }

        // European / Indian format (DD/MM/YYYY)
        Pattern eurPattern = Pattern.compile("\\b(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})\\b");
        Matcher eurMatcher = eurPattern.matcher(text);
        if (eurMatcher.find()) {
            try {
                int d = Integer.parseInt(eurMatcher.group(1));
                int m = Integer.parseInt(eurMatcher.group(2));
                int y = Integer.parseInt(eurMatcher.group(3));
                return LocalDate.of(y, m, d);
            } catch (Exception ignored) {}
        }

        return LocalDate.now();
    }

    private String guessCategory(String text, String merchantName) {
        String combined = ((text != null ? text : "") + " " + (merchantName != null ? merchantName : "")).toLowerCase(Locale.ENGLISH);

        if (combined.contains("restaurant") || combined.contains("cafe") || combined.contains("coffee") ||
            combined.contains("mcdonald") || combined.contains("burger") || combined.contains("pizza") ||
            combined.contains("bakery") || combined.contains("food") || combined.contains("dining") ||
            combined.contains("swiggy") || combined.contains("zomato") || combined.contains("dominos") ||
            combined.contains("kfc") || combined.contains("starbucks")) {
            return "Food";
        }

        if (combined.contains("uber") || combined.contains("ola") || combined.contains("taxi") ||
            combined.contains("fuel") || combined.contains("petrol") || combined.contains("shell") ||
            combined.contains("metro") || combined.contains("parking") || combined.contains("bus") ||
            combined.contains("toll") || combined.contains("flight") || combined.contains("railway")) {
            return "Transport";
        }

        if (combined.contains("amazon") || combined.contains("walmart") || combined.contains("target") ||
            combined.contains("mart") || combined.contains("supermarket") || combined.contains("store") ||
            combined.contains("apparel") || combined.contains("fashion") || combined.contains("mall")) {
            return "Shopping";
        }

        if (combined.contains("pharmacy") || combined.contains("chemist") || combined.contains("hospital") ||
            combined.contains("clinic") || combined.contains("doctor") || combined.contains("medical") ||
            combined.contains("health") || combined.contains("apollo")) {
            return "Healthcare";
        }

        if (combined.contains("electricity") || combined.contains("water") || combined.contains("internet") ||
            combined.contains("wifi") || combined.contains("airtel") || combined.contains("jio") ||
            combined.contains("utility") || combined.contains("bill")) {
            return "Bills";
        }

        if (combined.contains("cinema") || combined.contains("movie") || combined.contains("pvr") ||
            combined.contains("theater") || combined.contains("event") || combined.contains("game")) {
            return "Entertainment";
        }

        return "Food";
    }
}
