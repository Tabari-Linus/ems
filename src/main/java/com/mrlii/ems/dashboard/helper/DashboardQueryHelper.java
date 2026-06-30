package com.mrlii.ems.dashboard.helper;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.dashboard.dto.CompanyBreakdownResult;
import com.mrlii.ems.organization.company.entity.Company;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class DashboardQueryHelper {

    public static final String STATUS = "status";
    public static final String START = "start";
    @PersistenceContext
    private EntityManager em;

    public long countCompanies() {
        return em.createQuery(
                        "SELECT COUNT(c) FROM Company c WHERE c.deletedAt IS NULL", Long.class)
                .getSingleResult();
    }

    public long countOffices(Long companyId) {
        if (companyId != null) {
            return em.createQuery(
                            "SELECT COUNT(o) FROM Office o WHERE o.deletedAt IS NULL AND o.company.id = :cid", Long.class)
                    .setParameter("cid", companyId)
                    .getSingleResult();
        }
        return em.createQuery(
                        "SELECT COUNT(o) FROM Office o WHERE o.deletedAt IS NULL", Long.class)
                .getSingleResult();
    }

    public long countDepartments(Long companyId) {
        if (companyId != null) {
            return em.createQuery(
                            "SELECT COUNT(d) FROM Department d WHERE d.deletedAt IS NULL AND d.office.company.id = :cid", Long.class)
                    .setParameter("cid", companyId)
                    .getSingleResult();
        }
        return em.createQuery(
                        "SELECT COUNT(d) FROM Department d WHERE d.deletedAt IS NULL", Long.class)
                .getSingleResult();
    }

    public long countActiveEmployees(Long companyId) {
        if (companyId != null) {
            return em.createQuery(
                            "SELECT COUNT(e) FROM Employee e WHERE e.status = :status AND e.deletedAt IS NULL AND e.department IS NOT NULL AND e.department.office.company.id = :cid", Long.class)
                    .setParameter(STATUS, CommonStatus.ACTIVE)
                    .setParameter("cid", companyId)
                    .getSingleResult();
        }
        return em.createQuery(
                        "SELECT COUNT(e) FROM Employee e WHERE e.status = :status AND e.deletedAt IS NULL", Long.class)
                .setParameter(STATUS, CommonStatus.ACTIVE)
                .getSingleResult();
    }

    public long countNewHires(Long companyId, LocalDateTime start, LocalDateTime end) {
        if (companyId != null) {
            return em.createQuery(
                            "SELECT COUNT(e) FROM Employee e WHERE e.createdDate >= :start AND e.createdDate <= :end AND e.department IS NOT NULL AND e.department.office.company.id = :cid", Long.class)
                    .setParameter(START, start)
                    .setParameter("end", end)
                    .setParameter("cid", companyId)
                    .getSingleResult();
        }
        return em.createQuery(
                        "SELECT COUNT(e) FROM Employee e WHERE e.createdDate >= :start AND e.createdDate <= :end", Long.class)
                .setParameter(START, start)
                .setParameter("end", end)
                .getSingleResult();
    }

    public List<CompanyBreakdownResult> buildCompanyBreakdowns(Long companyId, LocalDateTime start, LocalDateTime end) {
        List<Company> companies = fetchCompanies(companyId);

        Map<Long, Long> officeCounts = groupedCount(
                "SELECT o.company.id, COUNT(o) FROM Office o WHERE o.deletedAt IS NULL GROUP BY o.company.id");

        Map<Long, Long> deptCounts = groupedCount(
                "SELECT d.office.company.id, COUNT(d) FROM Department d WHERE d.deletedAt IS NULL GROUP BY d.office.company.id");

        Map<Long, Long> empCounts = em.createQuery(
                        "SELECT e.department.office.company.id, COUNT(e) FROM Employee e WHERE e.status = :status AND e.deletedAt IS NULL AND e.department IS NOT NULL GROUP BY e.department.office.company.id",
                        Object[].class)
                .setParameter(STATUS, CommonStatus.ACTIVE)
                .getResultStream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        Map<Long, Long> hireCounts = em.createQuery(
                        "SELECT e.department.office.company.id, COUNT(e) FROM Employee e WHERE e.createdDate >= :start AND e.createdDate <= :end AND e.department IS NOT NULL GROUP BY e.department.office.company.id",
                        Object[].class)
                .setParameter(START, start)
                .setParameter("end", end)
                .getResultStream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        return companies.stream()
                .map(c -> new CompanyBreakdownResult(
                        c.getId(),
                        c.getCompanyName(),
                        officeCounts.getOrDefault(c.getId(), 0L).intValue(),
                        deptCounts.getOrDefault(c.getId(), 0L).intValue(),
                        empCounts.getOrDefault(c.getId(), 0L).intValue(),
                        hireCounts.getOrDefault(c.getId(), 0L).intValue()))
                .toList();
    }

    private List<Company> fetchCompanies(Long companyId) {
        if (companyId != null) {
            return em.createQuery(
                            "SELECT c FROM Company c WHERE c.deletedAt IS NULL AND c.id = :cid ORDER BY c.companyName", Company.class)
                    .setParameter("cid", companyId)
                    .getResultList();
        }
        return em.createQuery(
                        "SELECT c FROM Company c WHERE c.deletedAt IS NULL ORDER BY c.companyName", Company.class)
                .getResultList();
    }

    private Map<Long, Long> groupedCount(String jpql) {
        return em.createQuery(jpql, Object[].class)
                .getResultStream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }
}
