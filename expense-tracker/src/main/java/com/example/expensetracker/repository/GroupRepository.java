package com.example.expensetracker.repository;

import com.example.expensetracker.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByCreatorIdOrderByIdDesc(Long creatorId);
    
    @Query("SELECT g FROM Group g JOIN g.members m WHERE g.creator.id = :userId OR m.user.id = :userId")
    List<Group> findAllUserGroups(@Param("userId") Long userId);

    Optional<Group> findByIdAndCreatorId(Long id, Long creatorId);
}
