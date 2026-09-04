package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.LoanDto;
import com.example.expensetracker.dto.LoanRepaymentDto;
import com.example.expensetracker.entity.LoanType;
import com.example.expensetracker.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanService loanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanDto>>> getAllLoans(@RequestParam(required = false) LoanType type) {
        List<LoanDto> loans = (type != null) ? loanService.getLoansByType(type) : loanService.getAllLoans();
        return ResponseEntity.ok(ApiResponse.success("Fetched loans successfully", loans));
    }

    @GetMapping("/totals")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getLoanTotals() {
        return ResponseEntity.ok(ApiResponse.success("Fetched loan totals", loanService.getLoanTotals()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LoanDto>> createLoan(@Valid @RequestBody LoanDto dto) {
        LoanDto created = loanService.createLoan(dto);
        return ResponseEntity.ok(ApiResponse.success("Loan recorded successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanDto>> updateLoan(@PathVariable Long id, @Valid @RequestBody LoanDto dto) {
        LoanDto updated = loanService.updateLoan(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Loan updated successfully", updated));
    }

    @PostMapping("/{id}/repayments")
    public ResponseEntity<ApiResponse<LoanDto>> addRepayment(@PathVariable Long id, @Valid @RequestBody LoanRepaymentDto dto) {
        LoanDto updated = loanService.addRepayment(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Repayment recorded successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return ResponseEntity.ok(ApiResponse.success("Loan record deleted successfully"));
    }
}
