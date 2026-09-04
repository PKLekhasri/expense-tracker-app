package com.example.expensetracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "group_expense_splits")
public class GroupExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_expense_id", nullable = false)
    private GroupExpense groupExpense;

    @Column(name = "member_name", nullable = false)
    private String memberName;

    @Column(name = "amount_owed", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountOwed;

    @Column(name = "is_settled", nullable = false)
    private Boolean isSettled = false;

    public GroupExpenseSplit() {}

    public GroupExpenseSplit(GroupExpense groupExpense, String memberName, BigDecimal amountOwed, Boolean isSettled) {
        this.groupExpense = groupExpense;
        this.memberName = memberName;
        this.amountOwed = amountOwed;
        this.isSettled = isSettled != null ? isSettled : false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public GroupExpense getGroupExpense() {
        return groupExpense;
    }

    public void setGroupExpense(GroupExpense groupExpense) {
        this.groupExpense = groupExpense;
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
