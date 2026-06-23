package com.mrlii.ems.common.exception.graphql;

import com.mrlii.ems.common.exception.BusinessRuleViolationException;
import com.mrlii.ems.common.exception.DuplicateEntityException;
import com.mrlii.ems.common.exception.EntityNotFoundException;
import com.mrlii.ems.common.exception.InputValidationException;
import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.time.DateTimeException;
import java.time.format.DateTimeParseException;

@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
public class GraphQLExceptionAdvice {

    private final GraphQLErrorResponseBuilder errorResponseBuilder;

    @GraphQlExceptionHandler(InputValidationException.class)
    public GraphQLError handleInputValidationException(
            InputValidationException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                exception.getMessage(),
                GraphQLErrorType.BAD_REQUEST,
                GraphQLErrorCode.INPUT_VALIDATION_ERROR
        );
    }

    @GraphQlExceptionHandler(EntityNotFoundException.class)
    public GraphQLError handleEntityNotFoundException(
            EntityNotFoundException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                exception.getMessage(),
                GraphQLErrorType.NOT_FOUND,
                GraphQLErrorCode.NOT_FOUND
        );
    }

    @GraphQlExceptionHandler(DuplicateEntityException.class)
    public GraphQLError handleDuplicateEntityException(
            DuplicateEntityException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                exception.getMessage(),
                GraphQLErrorType.BAD_REQUEST,
                GraphQLErrorCode.DUPLICATE_RECORD
        );
    }

    @GraphQlExceptionHandler(BusinessRuleViolationException.class)
    public GraphQLError handleBusinessRuleViolationException(
            BusinessRuleViolationException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                exception.getMessage(),
                GraphQLErrorType.FAILED_PRECONDITION,
                GraphQLErrorCode.BUSINESS_RULE_VIOLATION
        );
    }

    @GraphQlExceptionHandler(BindException.class)
    public GraphQLError handleBindException(
            BindException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.bindValidationError(environment, exception);
    }

    @GraphQlExceptionHandler(ConstraintViolationException.class)
    public GraphQLError handleConstraintViolationException(
            ConstraintViolationException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.constraintValidationError(environment, exception);
    }

    @GraphQlExceptionHandler(IllegalArgumentException.class)
    public GraphQLError handleIllegalArgumentException(
            IllegalArgumentException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                "Invalid input",
                GraphQLErrorType.BAD_REQUEST,
                GraphQLErrorCode.VALIDATION_ERROR
        );
    }

    @GraphQlExceptionHandler(DateTimeParseException.class)
    public GraphQLError handleDateTimeParseException(
            DateTimeParseException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                "Invalid date format",
                GraphQLErrorType.BAD_REQUEST,
                GraphQLErrorCode.INVALID_DATE_FORMAT
        );
    }

    @GraphQlExceptionHandler(DateTimeException.class)
    public GraphQLError handleDateTimeException(
            DateTimeException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                "Invalid date value",
                GraphQLErrorType.BAD_REQUEST,
                GraphQLErrorCode.INVALID_DATE_VALUE
        );
    }

    @GraphQlExceptionHandler(DataIntegrityViolationException.class)
    public GraphQLError handleDataIntegrityViolationException(
            DataIntegrityViolationException exception,
            DataFetchingEnvironment environment
    ) {
        return errorResponseBuilder.singleError(
                environment,
                "Request violates data integrity rules",
                GraphQLErrorType.FAILED_PRECONDITION,
                GraphQLErrorCode.DATA_INTEGRITY_VIOLATION
        );
    }

    @GraphQlExceptionHandler(JpaSystemException.class)
    public GraphQLError handleJpaSystemException(
            JpaSystemException exception,
            DataFetchingEnvironment environment
    ) {
        return internalError(environment, exception);
    }

    @GraphQlExceptionHandler(Exception.class)
    public GraphQLError handleUnexpectedException(
            Exception exception,
            DataFetchingEnvironment environment
    ) {
        return internalError(environment, exception);
    }

    private GraphQLError internalError(
            DataFetchingEnvironment environment,
            Exception exception
    ) {
        log.error(
                "Unhandled GraphQL exception. field={}, path={}",
                environment.getField().getName(),
                environment.getExecutionStepInfo().getPath(),
                exception
        );

        return errorResponseBuilder.singleError(
                environment,
                "An unexpected error occurred",
                GraphQLErrorType.INTERNAL,
                GraphQLErrorCode.INTERNAL_ERROR
        );
    }
}
