package com.example.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class LoanRepaymentDto {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Repayment amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Repayment date is required")
    private LocalDate repaymentDate;

    private String notes;

    public LoanRepaymentDto() {}

    public LoanRepaymentDto(BigDecimal amount, LocalDate repaymentDate, String notes) {
        this.amount = amount;
        this.repaymentDate = repaymentDate;
        this.notes = notes;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getRepaymentDate() {
        return repaymentDate;
    }

    public void setRepaymentDate(LocalDate repaymentDate) {
        this.repaymentDate = repaymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
