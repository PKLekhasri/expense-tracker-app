package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ApiResponse;
import com.example.expensetracker.dto.CategorySummaryDto;
import com.example.expensetracker.dto.DashboardSummaryDto;
import com.example.expensetracker.dto.TrendSummaryDto;
import com.example.expensetracker.service.DashboardService;
import com.example.expensetracker.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ReminderService reminderService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getDashboardSummary(
            @RequestParam(required = false, defaultValue = "current_month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        // Also trigger check for new reminders on dashboard load
        try {
            reminderService.generateUserReminders();
        } catch (Exception ignored) {}

        DashboardSummaryDto summary = dashboardService.getDashboardSummary(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Fetched dashboard summary", summary));
    }

    @GetMapping("/category-summary")
    public ResponseEntity<ApiResponse<List<CategorySummaryDto>>> getCategorySummary(
            @RequestParam(required = false, defaultValue = "current_month") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<CategorySummaryDto> categorySummary = dashboardService.getCategorySummary(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Fetched category summary", categorySummary));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<List<TrendSummaryDto>>> getTrendData(@RequestParam(required = false) Integer year) {
        List<TrendSummaryDto> trend = dashboardService.getTrendData(year);
        return ResponseEntity.ok(ApiResponse.success("Fetched trend data", trend));
    }
}
