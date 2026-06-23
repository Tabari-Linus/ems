package com.mrlii.ems.accesslevel.util;

import com.mrlii.ems.accesslevel.entity.AccessLevel;
import com.mrlii.ems.common.enums.CommonStatus;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
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
class AccessLevelSpecificationTest {

    @Mock private Root<AccessLevel> root;
    @Mock private CriteriaQuery<?> query;
    @Mock private CriteriaBuilder cb;
    @Mock private Predicate predicate;

    @Test
    void hasStatus_buildsPredicate() {
        Path<Object> statusPath = mock(Path.class);
        when(root.get("status")).thenReturn(statusPath);
        when(cb.equal(statusPath, CommonStatus.ACTIVE)).thenReturn(predicate);

        Predicate result = AccessLevelSpecification.hasStatus(CommonStatus.ACTIVE)
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).equal(statusPath, CommonStatus.ACTIVE);
    }

    @Test
    void matchesSearch_buildsCaseInsensitiveOrPredicate() {
        Path<Object> namePath = mock(Path.class);
        Path<Object> descPath = mock(Path.class);
        Path<String> nameLower = mock(Path.class);
        Path<String> descLower = mock(Path.class);
        Predicate namePredicate = mock(Predicate.class);
        Predicate descPredicate = mock(Predicate.class);

        when(root.get("accessLevelName")).thenReturn(namePath);
        when(root.get("description")).thenReturn(descPath);
        when(cb.lower(namePath)).thenReturn(nameLower);
        when(cb.lower(descPath)).thenReturn(descLower);
        when(cb.like(eq(nameLower), any(String.class))).thenReturn(namePredicate);
        when(cb.like(eq(descLower), any(String.class))).thenReturn(descPredicate);
        when(cb.or(namePredicate, descPredicate)).thenReturn(predicate);

        Predicate result = AccessLevelSpecification.matchesSearch("admin")
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).like(nameLower, "%admin%");
        verify(cb).like(descLower, "%admin%");
        verify(cb).or(namePredicate, descPredicate);
    }

    @Test
    void notDeleted_buildsIsNullPredicate() {
        Path<Object> deletedAtPath = mock(Path.class);
        when(root.get("deletedAt")).thenReturn(deletedAtPath);
        when(cb.isNull(deletedAtPath)).thenReturn(predicate);

        Predicate result = AccessLevelSpecification.notDeleted()
                .toPredicate(root, query, cb);

        assertThat(result).isEqualTo(predicate);
        verify(cb).isNull(deletedAtPath);
    }
}
