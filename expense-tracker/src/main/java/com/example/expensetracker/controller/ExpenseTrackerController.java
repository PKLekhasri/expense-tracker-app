package com.example.expensetracker.controller;

import com.example.expensetracker.model.ExpenseTracker;
import com.example.expensetracker.repository.ExpenseTrackerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseTrackerController {

    @Autowired
    private ExpenseTrackerRepository expenseTrackerRepository;

    @GetMapping
    public List<ExpenseTracker> getAllExpenses() {
        return expenseTrackerRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<ExpenseTracker> getExpenseById(@PathVariable Long id) {
        return expenseTrackerRepository.findById(id);
    }

    @PostMapping
    public ExpenseTracker createExpense(@RequestBody ExpenseTracker expense) {
        return expenseTrackerRepository.save(expense);
    }

    @PutMapping("/{id}")
    public ExpenseTracker updateExpense(@PathVariable Long id, @RequestBody ExpenseTracker expenseDetails) {
        return expenseTrackerRepository.findById(id).map(expense -> {
            expense.setDescription(expenseDetails.getDescription());
            expense.setAmount(expenseDetails.getAmount());
            expense.setCategory(expenseDetails.getCategory());
            expense.setDate(expenseDetails.getDate());
            return expenseTrackerRepository.save(expense);
        }).orElseThrow(() -> new RuntimeException("Expense not found with id " + id));
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable Long id) {
        expenseTrackerRepository.deleteById(id);
    }
}
