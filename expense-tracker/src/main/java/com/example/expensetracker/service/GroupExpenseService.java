package com.example.expensetracker.service;

import com.example.expensetracker.dto.GroupDto;
import com.example.expensetracker.dto.GroupExpenseDto;
import com.example.expensetracker.entity.*;
import com.example.expensetracker.exception.BadRequestException;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupExpenseService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GroupExpenseRepository groupExpenseRepository;

    @Autowired
    private GroupExpenseSplitRepository groupExpenseSplitRepository;

    @Autowired
    private AuthService authService;

    public List<GroupDto> getUserGroups() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return groupRepository.findAllUserGroups(currentUser.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupDto createGroup(GroupDto dto) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Group group = new Group(dto.getGroupName(), currentUser);
        Group savedGroup = groupRepository.save(group);

        // Add creator as member
        GroupMember creatorMember = new GroupMember(savedGroup, currentUser, currentUser.getUsername());
        groupMemberRepository.save(creatorMember);
        savedGroup.getMembers().add(creatorMember);

        // Add optional other members
        if (dto.getMemberNames() != null) {
            for (String name : dto.getMemberNames()) {
                if (name != null && !name.trim().isEmpty() && !name.equalsIgnoreCase(currentUser.getUsername())) {
                    GroupMember member = new GroupMember(savedGroup, null, name.trim());
                    groupMemberRepository.save(member);
                    savedGroup.getMembers().add(member);
                }
            }
        }

        return convertToDto(savedGroup);
    }

    @Transactional
    public GroupDto addMemberToGroup(Long groupId, String memberName) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        GroupMember member = new GroupMember(group, null, memberName.trim());
        groupMemberRepository.save(member);
        group.getMembers().add(member);

        return convertToDto(group);
    }

    @Transactional
    public GroupExpenseDto addExpenseToGroup(Long groupId, GroupExpenseDto dto) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        GroupExpense expense = new GroupExpense(
                group,
                dto.getDescription(),
                dto.getTotalAmount(),
                dto.getPaidByName(),
                dto.getDate() != null ? dto.getDate() : LocalDate.now()
        );
        GroupExpense savedExpense = groupExpenseRepository.save(expense);

        List<String> members = dto.getMembers();
        if (members == null || members.isEmpty()) {
            throw new BadRequestException("At least one member must be included in split");
        }

        BigDecimal count = new BigDecimal(members.size());
        BigDecimal equalSplit = dto.getTotalAmount().divide(count, 2, RoundingMode.HALF_UP);

        List<GroupExpenseSplit> splits = new ArrayList<>();
        for (String memberName : members) {
            boolean isPayer = memberName.equalsIgnoreCase(dto.getPaidByName());
            // If payer is in the split, their share is settled/self
            GroupExpenseSplit split = new GroupExpenseSplit(
                    savedExpense,
                    memberName,
                    equalSplit,
                    isPayer
            );
            splits.add(groupExpenseSplitRepository.save(split));
        }

        savedExpense.setSplits(splits);
        return convertExpenseToDto(savedExpense);
    }

    @Transactional
    public void markSplitAsSettled(Long splitId) {
        GroupExpenseSplit split = groupExpenseSplitRepository.findById(splitId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense split not found with id: " + splitId));
        split.setIsSettled(true);
        groupExpenseSplitRepository.save(split);
    }

    public List<Map<String, Object>> getGroupBalances(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        List<GroupExpense> expenses = groupExpenseRepository.findByGroupIdOrderByDateDesc(groupId);
        User currentUser = authService.getCurrentAuthenticatedUser();
        String currentUsername = currentUser.getUsername();

        List<Map<String, Object>> balances = new ArrayList<>();

        for (GroupExpense exp : expenses) {
            for (GroupExpenseSplit split : exp.getSplits()) {
                if (!split.getIsSettled()) {
                    String paidBy = exp.getPaidByName();
                    String owes = split.getMemberName();

                    if (!paidBy.equalsIgnoreCase(owes)) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("splitId", split.getId());
                        map.put("expenseDescription", exp.getDescription());
                        map.put("paidBy", paidBy);
                        map.put("owes", owes);
                        map.put("amount", split.getAmountOwed());

                        if (currentUsername.equalsIgnoreCase(owes)) {
                            map.put("summaryText", "You owe " + paidBy + " ₹" + split.getAmountOwed());
                        } else if (currentUsername.equalsIgnoreCase(paidBy)) {
                            map.put("summaryText", owes + " owes you ₹" + split.getAmountOwed());
                        } else {
                            map.put("summaryText", owes + " owes " + paidBy + " ₹" + split.getAmountOwed());
                        }

                        balances.add(map);
                    }
                }
            }
        }

        return balances;
    }

    private GroupDto convertToDto(Group g) {
        GroupDto dto = new GroupDto();
        dto.setId(g.getId());
        dto.setGroupName(g.getGroupName());
        dto.setCreatorName(g.getCreator().getUsername());

        List<String> memberNames = g.getMembers().stream()
                .map(GroupMember::getMemberName)
                .collect(Collectors.toList());
        dto.setMemberNames(memberNames);

        List<GroupExpenseDto> expDtos = groupExpenseRepository.findByGroupIdOrderByDateDesc(g.getId())
                .stream()
                .map(this::convertExpenseToDto)
                .collect(Collectors.toList());
        dto.setExpenses(expDtos);

        return dto;
    }

    private GroupExpenseDto convertExpenseToDto(GroupExpense e) {
        GroupExpenseDto dto = new GroupExpenseDto();
        dto.setId(e.getId());
        dto.setGroupId(e.getGroup().getId());
        dto.setDescription(e.getDescription());
        dto.setTotalAmount(e.getTotalAmount());
        dto.setPaidByName(e.getPaidByName());
        dto.setDate(e.getDate());

        List<GroupExpenseDto.SplitDetailDto> splits = e.getSplits().stream()
                .map(s -> new GroupExpenseDto.SplitDetailDto(s.getId(), s.getMemberName(), s.getAmountOwed(), s.getIsSettled()))
                .collect(Collectors.toList());
        dto.setSplits(splits);

        return dto;
    }
}
