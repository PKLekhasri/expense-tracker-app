package com.example.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class GroupExpenseDto {
    private Long id;
    private Long groupId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than 0")
    private BigDecimal totalAmount;

    @NotBlank(message = "Paid by name is required")
    private String paidByName;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotEmpty(message = "Split members are required")
    private List<String> members;

    private List<SplitDetailDto> splits;

    public GroupExpenseDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getPaidByName() {
        return paidByName;
    }

    public void setPaidByName(String paidByName) {
        this.paidByName = paidByName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }

    public List<SplitDetailDto> getSplits() {
        return splits;
    }

    public void setSplits(List<SplitDetailDto> splits) {
        this.splits = splits;
    }

    public static class SplitDetailDto {
        private Long splitId;
        private String memberName;
        private BigDecimal amountOwed;
        private Boolean isSettled;

        public SplitDetailDto() {}

        public SplitDetailDto(Long splitId, String memberName, BigDecimal amountOwed, Boolean isSettled) {
            this.splitId = splitId;
            this.memberName = memberName;
            this.amountOwed = amountOwed;
            this.isSettled = isSettled;
        }

        public Long getSplitId() {
            return splitId;
        }

        public void setSplitId(Long splitId) {
            this.splitId = splitId;
        }

        public String getMemberName() {
            return memberName;
        }

        public void setMemberName(String memberName) {
            this.memberName = memberName;
        }

        public BigDecimal getAmountOwed() {
            return amountOwed;
        }

        public void setAmountOwed(BigDecimal amountOwed) {
            this.amountOwed = amountOwed;
        }

        public Boolean getIsSettled() {
            return isSettled;
        }

        public void setIsSettled(Boolean isSettled) {
            this.isSettled = isSettled;
        }
    }
}
