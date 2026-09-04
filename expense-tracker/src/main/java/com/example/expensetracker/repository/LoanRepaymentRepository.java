package com.example.expensetracker.repository;

import com.example.expensetracker.entity.LoanRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, Long> {
    List<LoanRepayment> findByLoanIdOrderByRepaymentDateDescCreatedAtDesc(Long loanId);
}
