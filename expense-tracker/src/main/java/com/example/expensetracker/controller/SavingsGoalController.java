package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.SavingsGoalDto;
import com.example.expensetracker.service.SavingsGoalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class SavingsGoalController {

    @Autowired
    private SavingsGoalService savingsGoalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingsGoalDto>>> getAllGoals() {
        return ResponseEntity.ok(ApiResponse.success("Fetched savings goals", savingsGoalService.getAllSavingsGoals()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavingsGoalDto>> createGoal(@Valid @RequestBody SavingsGoalDto dto) {
        SavingsGoalDto created = savingsGoalService.createSavingsGoal(dto);
        return ResponseEntity.ok(ApiResponse.success("Savings goal created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingsGoalDto>> updateGoal(@PathVariable Long id, @Valid @RequestBody SavingsGoalDto dto) {
        SavingsGoalDto updated = savingsGoalService.updateSavingsGoal(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Savings goal updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteGoal(@PathVariable Long id) {
        savingsGoalService.deleteSavingsGoal(id);
        return ResponseEntity.ok(ApiResponse.success("Savings goal deleted successfully"));
    }
}
