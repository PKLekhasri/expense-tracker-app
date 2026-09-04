package com.example.expensetracker.dto;

import java.math.BigDecimal;

public class TrendSummaryDto {
    private String month;
    private BigDecimal income;
    private BigDecimal expense;

    public TrendSummaryDto() {}

    public TrendSummaryDto(String month, BigDecimal income, BigDecimal expense) {
        this.month = month;
        this.income = income;
        this.expense = expense;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getIncome() {
        return income;
    }

    public void setIncome(BigDecimal income) {
        this.income = income;
    }

    public BigDecimal getExpense() {
        return expense;
    }

    public void setExpense(BigDecimal expense) {
        this.expense = expense;
    }
}
