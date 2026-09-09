package com.example.expensetracker.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReceiptScanDto {
    private BigDecimal amount;
    private String merchantName;
    private LocalDate date;
    private String guessedCategory;
    private String rawText;
    private Double confidence;
    private Boolean success;
    private String message;

    public ReceiptScanDto() {}

    public ReceiptScanDto(BigDecimal amount, String merchantName, LocalDate date, String guessedCategory, String rawText, Double confidence, Boolean success, String message) {
        this.amount = amount;
        this.merchantName = merchantName;
        this.date = date;
        this.guessedCategory = guessedCategory;
        this.rawText = rawText;
        this.confidence = confidence;
        this.success = success;
        this.message = message;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getMerchantName() {
        return merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getGuessedCategory() {
        return guessedCategory;
    }

    public void setGuessedCategory(String guessedCategory) {
        this.guessedCategory = guessedCategory;
    }

    public String getRawText() {
        return rawText;
    }

    public void setRawText(String rawText) {
        this.rawText = rawText;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
