package com.mrlii.ems.organization.employee.util;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.organization.employee.entity.Employee;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class EmployeeSpecificationTest {

    @Mock private Root<Employee> root;
    @Mock private CriteriaQuery<?> query;
    @Mock private CriteriaBuilder cb;
    @Mock private Predicate predicate;

    @Test
    void hasStatus_buildsPredicate() {
        Path<Object> statusPath = mock(Path.class);
        when(root.get("status")).thenReturn(statusPath);
        when(cb.equal(statusPath, CommonStatus.ACTIVE)).thenReturn(predicate);

        Predicate result = EmployeeSpecification.hasStatus(CommonStatus.ACTIVE)
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).equal(statusPath, CommonStatus.ACTIVE);
    }

    @Test
    void hasDepartment_buildsPredicate() {
        Path<Object> deptPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        when(root.get("department")).thenReturn(deptPath);
        when(deptPath.get("id")).thenReturn(idPath);
        when(cb.equal(idPath, 5L)).thenReturn(predicate);

        Predicate result = EmployeeSpecification.hasDepartment(5L)
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).equal(idPath, 5L);
    }

    @Test
    void hasPosition_buildsPredicate() {
        Path<Object> posPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        when(root.get("position")).thenReturn(posPath);
        when(posPath.get("id")).thenReturn(idPath);
        when(cb.equal(idPath, 3L)).thenReturn(predicate);

        Predicate result = EmployeeSpecification.hasPosition(3L)
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).equal(idPath, 3L);
    }

    @Test
    void matchesSearch_buildsCaseInsensitiveOrPredicate() {
        Path<Object> firstPath = mock(Path.class);
        Path<Object> lastPath = mock(Path.class);
        Path<Object> emailPath = mock(Path.class);
        Expression<String> firstLower = mock(Expression.class);
        Expression<String> lastLower = mock(Expression.class);
        Expression<String> emailLower = mock(Expression.class);
        Predicate p1 = mock(Predicate.class);
        Predicate p2 = mock(Predicate.class);
        Predicate p3 = mock(Predicate.class);

        when(root.get("firstName")).thenReturn(firstPath);
        when(root.get("lastName")).thenReturn(lastPath);
        when(root.get("workEmail")).thenReturn(emailPath);
        when(cb.lower(any())).thenReturn(firstLower).thenReturn(lastLower).thenReturn(emailLower);
        when(cb.like(eq(firstLower), any(String.class))).thenReturn(p1);
        when(cb.like(eq(lastLower), any(String.class))).thenReturn(p2);
        when(cb.like(eq(emailLower), any(String.class))).thenReturn(p3);
        when(cb.or(p1, p2, p3)).thenReturn(predicate);

        Predicate result = EmployeeSpecification.matchesSearch("john")
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).like(firstLower, "%john%");
        verify(cb).like(lastLower, "%john%");
        verify(cb).like(emailLower, "%john%");
    }

    @Test
    void notDeleted_buildsIsNullPredicate() {
        Path<Object> deletedAtPath = mock(Path.class);
        when(root.get("deletedAt")).thenReturn(deletedAtPath);
        when(cb.isNull(deletedAtPath)).thenReturn(predicate);

        Predicate result = EmployeeSpecification.notDeleted()
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).isNull(deletedAtPath);
    }
}
