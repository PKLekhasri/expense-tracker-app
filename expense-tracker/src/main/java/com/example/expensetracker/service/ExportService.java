package com.example.expensetracker.service;

import com.example.expensetracker.dto.DashboardSummaryDto;
import com.example.expensetracker.dto.TransactionDto;
import com.example.expensetracker.entity.User;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportService {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AuthService authService;

    // ============================================================
    // PDF REPORT
    // ============================================================

    public ByteArrayInputStream generatePdfReport(
            String period,
            LocalDate startDate,
            LocalDate endDate) {

        User currentUser = authService.getCurrentAuthenticatedUser();

        List<TransactionDto> transactions;

        if ("custom".equalsIgnoreCase(period)
                && startDate != null
                && endDate != null) {

            transactions = transactionService.getTransactionsBetween(
                    startDate,
                    endDate
            );

        } else {

            transactions = transactionService.getAllTransactions();
        }

        DashboardSummaryDto summary =
                dashboardService.getDashboardSummary(
                        period,
                        startDate,
                        endDate
                );

        Document document = new Document(PageSize.A4);

        ByteArrayOutputStream out =
                new ByteArrayOutputStream();

        try {

            PdfWriter.getInstance(document, out);

            document.open();

            // ----------------------------------------------------
            // Fonts
            // ----------------------------------------------------

            com.lowagie.text.Font titleFont =
                    FontFactory.getFont(
                            FontFactory.HELVETICA_BOLD,
                            18,
                            java.awt.Color.DARK_GRAY
                    );

            com.lowagie.text.Font subTitleFont =
                    FontFactory.getFont(
                            FontFactory.HELVETICA,
                            12,
                            java.awt.Color.GRAY
                    );

            com.lowagie.text.Font boldFont =
                    FontFactory.getFont(
                            FontFactory.HELVETICA_BOLD,
                            10,
                            java.awt.Color.BLACK
                    );

            com.lowagie.text.Font cellFont =
                    FontFactory.getFont(
                            FontFactory.HELVETICA,
                            10,
                            java.awt.Color.BLACK
                    );

            // ----------------------------------------------------
            // Title
            // ----------------------------------------------------

            Paragraph title =
                    new Paragraph(
                            "ExpenseTracker — Financial Report",
                            titleFont
                    );

            title.setAlignment(Element.ALIGN_CENTER);

            document.add(title);

            // ----------------------------------------------------
            // Report Information
            // ----------------------------------------------------

            Paragraph meta =
                    new Paragraph(
                            "User: "
                                    + currentUser.getUsername()
                                    + " | Period: "
                                    + summary.getPeriodName()
                                    + " | Generated: "
                                    + LocalDate.now(),
                            subTitleFont
                    );

            meta.setAlignment(Element.ALIGN_CENTER);

            meta.setSpacingAfter(15);

            document.add(meta);

            // ----------------------------------------------------
            // Summary Table
            // ----------------------------------------------------

            PdfPTable summaryTable =
                    new PdfPTable(3);

            summaryTable.setWidthPercentage(100);

            summaryTable.setSpacingAfter(20);

            addCell(
                    summaryTable,
                    "Total Income: ₹"
                            + summary.getTotalIncome(),
                    boldFont,
                    java.awt.Color.LIGHT_GRAY
            );

            addCell(
                    summaryTable,
                    "Total Expenses: ₹"
                            + summary.getTotalExpenses(),
                    boldFont,
                    java.awt.Color.LIGHT_GRAY
            );

            addCell(
                    summaryTable,
                    "Net Balance: ₹"
                            + summary.getCurrentBalance(),
                    boldFont,
                    java.awt.Color.LIGHT_GRAY
            );

            document.add(summaryTable);

            // ----------------------------------------------------
            // Transactions Table
            // ----------------------------------------------------

            PdfPTable table =
                    new PdfPTable(5);

            table.setWidthPercentage(100);

            table.setWidths(
                    new float[]{
                            2f,
                            4f,
                            3f,
                            2f,
                            3f
                    }
            );

            // ----------------------------------------------------
            // Table Headers
            // ----------------------------------------------------

            String[] headers = {
                    "Date",
                    "Description",
                    "Category",
                    "Type",
                    "Amount (₹)"
            };

            for (String h : headers) {

                PdfPCell headerCell =
                        new PdfPCell(
                                new Phrase(
                                        h,
                                        boldFont
                                )
                        );

                headerCell.setBackgroundColor(
                        new java.awt.Color(
                                230,
                                230,
                                250
                        )
                );

                headerCell.setPadding(6);

                headerCell.setHorizontalAlignment(
                        Element.ALIGN_CENTER
                );

                table.addCell(headerCell);
            }

            // ----------------------------------------------------
            // Transaction Data
            // ----------------------------------------------------

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                            "dd-MMM-yyyy"
                    );

            for (TransactionDto tx : transactions) {

                table.addCell(
                        new Phrase(
                                tx.getDate().format(formatter),
                                cellFont
                        )
                );

                table.addCell(
                        new Phrase(
                                tx.getDescription() != null
                                        ? tx.getDescription()
                                        : "",
                                cellFont
                        )
                );

                table.addCell(
                        new Phrase(
                                tx.getCategory(),
                                cellFont
                        )
                );

                table.addCell(
                        new Phrase(
                                tx.getType().name(),
                                cellFont
                        )
                );

                table.addCell(
                        new Phrase(
                                "₹"
                                        + tx.getAmount().toString(),
                                cellFont
                        )
                );
            }

            document.add(table);

            document.close();

        } catch (Exception ex) {

            throw new RuntimeException(
                    "Failed to generate PDF report: "
                            + ex.getMessage(),
                    ex
            );
        }

        return new ByteArrayInputStream(
                out.toByteArray()
        );
    }

    // ============================================================
    // EXCEL REPORT
    // ============================================================

    public ByteArrayInputStream generateExcelReport(
            String period,
            LocalDate startDate,
            LocalDate endDate) {

        User currentUser =
                authService.getCurrentAuthenticatedUser();

        List<TransactionDto> transactions;

        if ("custom".equalsIgnoreCase(period)
                && startDate != null
                && endDate != null) {

            transactions =
                    transactionService.getTransactionsBetween(
                            startDate,
                            endDate
                    );

        } else {

            transactions =
                    transactionService.getAllTransactions();
        }

        DashboardSummaryDto summary =
                dashboardService.getDashboardSummary(
                        period,
                        startDate,
                        endDate
                );

        try (
                Workbook workbook =
                        new XSSFWorkbook();

                ByteArrayOutputStream out =
                        new ByteArrayOutputStream()
        ) {

            Sheet sheet =
                    workbook.createSheet(
                            "Transactions"
                    );

            // ----------------------------------------------------
            // Header Style
            // ----------------------------------------------------

            org.apache.poi.ss.usermodel.Font headerFont =
                    workbook.createFont();

            headerFont.setBold(true);

            headerFont.setColor(
                    IndexedColors.WHITE.getIndex()
            );

            CellStyle headerCellStyle =
                    workbook.createCellStyle();

            headerCellStyle.setFont(headerFont);

            headerCellStyle.setFillForegroundColor(
                    IndexedColors.INDIGO.getIndex()
            );

            headerCellStyle.setFillPattern(
                    FillPatternType.SOLID_FOREGROUND
            );

            // ----------------------------------------------------
            // Summary Information
            // ----------------------------------------------------

            org.apache.poi.ss.usermodel.Row titleRow =
                    sheet.createRow(0);

            titleRow.createCell(0)
                    .setCellValue(
                            "ExpenseTracker Report — User: "
                                    + currentUser.getUsername()
                    );

            org.apache.poi.ss.usermodel.Row summaryRow =
                    sheet.createRow(1);

            summaryRow.createCell(0)
                    .setCellValue(
                            "Period: "
                                    + summary.getPeriodName()
                                    + " | Income: ₹"
                                    + summary.getTotalIncome()
                                    + " | Expenses: ₹"
                                    + summary.getTotalExpenses()
                                    + " | Balance: ₹"
                                    + summary.getCurrentBalance()
                    );

            // ----------------------------------------------------
            // Table Headers
            // ----------------------------------------------------

            String[] columns = {
                    "Date",
                    "Description",
                    "Category",
                    "Type",
                    "Amount"
            };

            org.apache.poi.ss.usermodel.Row headerRow =
                    sheet.createRow(3);

            for (int col = 0;
                 col < columns.length;
                 col++) {

                org.apache.poi.ss.usermodel.Cell cell =
                        headerRow.createCell(col);

                cell.setCellValue(
                        columns[col]
                );

                cell.setCellStyle(
                        headerCellStyle
                );
            }

            // ----------------------------------------------------
            // Transaction Data
            // ----------------------------------------------------

            int rowIdx = 4;

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                            "yyyy-MM-dd"
                    );

            for (TransactionDto tx : transactions) {

                org.apache.poi.ss.usermodel.Row row =
                        sheet.createRow(rowIdx++);

                row.createCell(0)
                        .setCellValue(
                                tx.getDate()
                                        .format(formatter)
                        );

                row.createCell(1)
                        .setCellValue(
                                tx.getDescription() != null
                                        ? tx.getDescription()
                                        : ""
                        );

                row.createCell(2)
                        .setCellValue(
                                tx.getCategory()
                        );

                row.createCell(3)
                        .setCellValue(
                                tx.getType().name()
                        );

                row.createCell(4)
                        .setCellValue(
                                tx.getAmount()
                                        .doubleValue()
                        );
            }

            // ----------------------------------------------------
            // Auto Size Columns
            // ----------------------------------------------------

            for (int i = 0;
                 i < columns.length;
                 i++) {

                sheet.autoSizeColumn(i);
            }

            // ----------------------------------------------------
            // Write Excel File
            // ----------------------------------------------------

            workbook.write(out);

            return new ByteArrayInputStream(
                    out.toByteArray()
            );

        } catch (IOException e) {

            throw new RuntimeException(
                    "Failed to generate Excel report: "
                            + e.getMessage(),
                    e
            );
        }
    }

    // ============================================================
    // PDF SUMMARY CELL
    // ============================================================

    private void addCell(
            PdfPTable table,
            String text,
            com.lowagie.text.Font font,
            java.awt.Color bg) {

        PdfPCell cell =
                new PdfPCell(
                        new Phrase(
                                text,
                                font
                        )
                );

        cell.setBackgroundColor(bg);

        cell.setPadding(8);

        cell.setHorizontalAlignment(
                Element.ALIGN_CENTER
        );

        table.addCell(cell);
    }
}