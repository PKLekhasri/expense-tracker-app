package com.example.expensetracker.dto;

import com.example.expensetracker.entity.LoanStatus;
import com.example.expensetracker.entity.LoanType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class LoanDto {
    private Long id;

    @NotBlank(message = "Person name is required")
    private String personName;

    @NotNull(message = "Loan type is required")
    private LoanType type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    private BigDecimal remainingAmount;

    @NotNull(message = "Date given/taken is required")
    private LocalDate dateGivenTaken;

    private LocalDate dueDate;
    private LoanStatus status;

    @Min(value = 0, message = "Reminder days cannot be negative")
    private Integer reminderDays = 3;

    private String notes;
    private Integer daysRemaining;
    private String statusText;
    private List<LoanRepaymentDto> repayments;

    public LoanDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPersonName() {
        return personName;
    }

    public void setPersonName(String personName) {
        this.personName = personName;
    }

    public LoanType getType() {
        return type;
    }

    public void setType(LoanType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public LocalDate getDateGivenTaken() {
        return dateGivenTaken;
    }

    public void setDateGivenTaken(LocalDate dateGivenTaken) {
        this.dateGivenTaken = dateGivenTaken;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public Integer getReminderDays() {
        return reminderDays;
    }

    public void setReminderDays(Integer reminderDays) {
        this.reminderDays = reminderDays;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getDaysRemaining() {
        return daysRemaining;
    }

    public void setDaysRemaining(Integer daysRemaining) {
        this.daysRemaining = daysRemaining;
    }

    public String getStatusText() {
        return statusText;
    }

    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public List<LoanRepaymentDto> getRepayments() {
        return repayments;
    }

    public void setRepayments(List<LoanRepaymentDto> repayments) {
        this.repayments = repayments;
    }
}
