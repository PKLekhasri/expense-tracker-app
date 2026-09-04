package com.example.expensetracker.repository;

import com.example.expensetracker.entity.Loan;
import com.example.expensetracker.entity.LoanStatus;
import com.example.expensetracker.entity.LoanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserIdOrderByDueDateAsc(Long userId);
    List<Loan> findByUserIdAndTypeOrderByDueDateAsc(Long userId, LoanType type);
    Optional<Loan> findByIdAndUserId(Long id, Long userId);
    List<Loan> findByStatusNot(LoanStatus status);
}
