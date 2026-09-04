package com.example.expensetracker.dto;

import java.math.BigDecimal;

public class CategorySummaryDto {
    private String category;
    private BigDecimal amount;
    private Double percentage;

    public CategorySummaryDto() {}

    public CategorySummaryDto(String category, BigDecimal amount, Double percentage) {
        this.category = category;
        this.amount = amount;
        this.percentage = percentage;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }
}
