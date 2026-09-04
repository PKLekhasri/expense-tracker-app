package com.example.expensetracker.repository;

import com.example.expensetracker.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserIdOrderByDueDateAsc(Long userId);
    Optional<Bill> findByIdAndUserId(Long id, Long userId);
    List<Bill> findByUserIdAndIsPaidFalse(Long userId);
    List<Bill> findByIsPaidFalse();
}
