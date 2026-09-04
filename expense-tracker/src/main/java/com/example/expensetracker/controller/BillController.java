package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.BillDto;
import com.example.expensetracker.service.BillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private BillService billService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BillDto>>> getAllBills() {
        return ResponseEntity.ok(ApiResponse.success("Fetched recurring bills", billService.getAllBills()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BillDto>> createBill(@Valid @RequestBody BillDto dto) {
        BillDto created = billService.createBill(dto);
        return ResponseEntity.ok(ApiResponse.success("Bill added successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BillDto>> updateBill(@PathVariable Long id, @Valid @RequestBody BillDto dto) {
        BillDto updated = billService.updateBill(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Bill updated successfully", updated));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<BillDto>> markAsPaid(@PathVariable Long id) {
        BillDto updated = billService.markAsPaid(id);
        return ResponseEntity.ok(ApiResponse.success("Bill marked as paid", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted successfully"));
    }
}
