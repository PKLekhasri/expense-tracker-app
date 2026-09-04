package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.IncomeRequest;
import com.example.expensetracker.entity.MonthlyIncome;
import com.example.expensetracker.service.IncomeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyIncome>>> getAllIncomes() {
        return ResponseEntity.ok(ApiResponse.success("Fetched all monthly incomes", incomeService.getAllIncomesForUser()));
    }

    @GetMapping("/{year}/{month}")
    public ResponseEntity<ApiResponse<MonthlyIncome>> getIncomeForMonth(@PathVariable Integer year, @PathVariable Integer month) {
        Optional<MonthlyIncome> income = incomeService.getIncomeForMonthAndYear(month, year);
        return income.map(monthlyIncome -> ResponseEntity.ok(ApiResponse.success("Fetched monthly income", monthlyIncome)))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success("No income recorded for specified month", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MonthlyIncome>> saveOrUpdateIncome(@Valid @RequestBody IncomeRequest request) {
        MonthlyIncome saved = incomeService.saveOrUpdateIncome(request);
        return ResponseEntity.ok(ApiResponse.success("Monthly income saved successfully", saved));
    }
}
