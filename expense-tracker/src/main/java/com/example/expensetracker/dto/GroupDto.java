package com.example.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class GroupDto {
    private Long id;

    @NotBlank(message = "Group name is required")
    private String groupName;

    private String creatorName;
    private List<String> memberNames;
    private List<GroupExpenseDto> expenses;

    public GroupDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public List<String> getMemberNames() {
        return memberNames;
    }

    public void setMemberNames(List<String> memberNames) {
        this.memberNames = memberNames;
    }

    public List<GroupExpenseDto> getExpenses() {
        return expenses;
    }

    public void setExpenses(List<GroupExpenseDto> expenses) {
        this.expenses = expenses;
    }
}
