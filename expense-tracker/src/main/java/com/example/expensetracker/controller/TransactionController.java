package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.ReceiptScanDto;
import com.example.expensetracker.dto.TransactionDto;
import com.example.expensetracker.service.ReceiptOcrService;
import com.example.expensetracker.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private ReceiptOcrService receiptOcrService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionDto>>> getAllTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<TransactionDto> transactions;
        if (startDate != null && endDate != null) {
            transactions = transactionService.getTransactionsBetween(startDate, endDate);
        } else {
            transactions = transactionService.getAllTransactions();
        }
        return ResponseEntity.ok(ApiResponse.success("Fetched transactions successfully", transactions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> getTransactionById(@PathVariable Long id) {
        TransactionDto dto = transactionService.getTransactionById(id);
        return ResponseEntity.ok(ApiResponse.success("Fetched transaction successfully", dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionDto>> createTransaction(@Valid @RequestBody TransactionDto dto) {
        TransactionDto created = transactionService.createTransaction(dto);
        return ResponseEntity.ok(ApiResponse.success("Transaction added successfully", created));
    }

    @PostMapping("/upload-receipt")
    public ResponseEntity<ApiResponse<ReceiptScanDto>> uploadReceipt(@RequestParam("file") MultipartFile file) {
        ReceiptScanDto result = receiptOcrService.scanReceipt(file);
        return ResponseEntity.ok(ApiResponse.success("Receipt scanned successfully", result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> updateTransaction(@PathVariable Long id, @Valid @RequestBody TransactionDto dto) {
        TransactionDto updated = transactionService.updateTransaction(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Transaction updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted successfully"));
    }
}
