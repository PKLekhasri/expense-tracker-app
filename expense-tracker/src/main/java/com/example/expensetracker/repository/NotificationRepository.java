package com.example.expensetracker.repository;

import com.example.expensetracker.entity.Notification;
import com.example.expensetracker.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    Boolean existsByUserIdAndTypeAndReferenceIdAndTitle(Long userId, NotificationType type, Long referenceId, String title);
}
