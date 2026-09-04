package com.example.expensetracker.repository;

import com.example.expensetracker.entity.MonthlyIncome;
import com.example.expensetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyIncomeRepository extends JpaRepository<MonthlyIncome, Long> {
    Optional<MonthlyIncome> findByUserAndMonthAndYear(User user, Integer month, Integer year);
    List<MonthlyIncome> findByUserIdAndYear(Long userId, Integer year);
    List<MonthlyIncome> findByUserId(Long userId);
}
