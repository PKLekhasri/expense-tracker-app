package com.example.expensetracker.repository;

import com.example.expensetracker.model.ExpenseTracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseTrackerRepository extends JpaRepository<ExpenseTracker, Long> {
}
