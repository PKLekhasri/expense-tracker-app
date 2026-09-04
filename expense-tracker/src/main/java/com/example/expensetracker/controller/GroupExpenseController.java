package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.GroupDto;
import com.example.expensetracker.dto.GroupExpenseDto;
import com.example.expensetracker.service.GroupExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupExpenseController {

    @Autowired
    private GroupExpenseService groupExpenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupDto>>> getUserGroups() {
        return ResponseEntity.ok(ApiResponse.success("Fetched user groups", groupExpenseService.getUserGroups()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupDto>> createGroup(@Valid @RequestBody GroupDto dto) {
        GroupDto created = groupExpenseService.createGroup(dto);
        return ResponseEntity.ok(ApiResponse.success("Group created successfully", created));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ApiResponse<GroupDto>> addMember(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String memberName = body.get("memberName");
        GroupDto updated = groupExpenseService.addMemberToGroup(id, memberName);
        return ResponseEntity.ok(ApiResponse.success("Member added to group", updated));
    }

    @PostMapping("/{id}/expenses")
    public ResponseEntity<ApiResponse<GroupExpenseDto>> addExpense(@PathVariable Long id, @Valid @RequestBody GroupExpenseDto dto) {
        GroupExpenseDto created = groupExpenseService.addExpenseToGroup(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Group expense added successfully", created));
    }

    @GetMapping("/{id}/balances")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBalances(@PathVariable Long id) {
        List<Map<String, Object>> balances = groupExpenseService.getGroupBalances(id);
        return ResponseEntity.ok(ApiResponse.success("Fetched group balances", balances));
    }

    @PostMapping("/splits/{splitId}/settle")
    public ResponseEntity<ApiResponse<Object>> settleSplit(@PathVariable Long splitId) {
        groupExpenseService.markSplitAsSettled(splitId);
        return ResponseEntity.ok(ApiResponse.success("Shared expense marked as settled"));
    }
}
