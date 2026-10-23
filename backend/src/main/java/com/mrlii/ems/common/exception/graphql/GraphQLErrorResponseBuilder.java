package com.mrlii.ems.common.exception.graphql;

import graphql.ErrorClassification;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class GraphQLErrorResponseBuilder {

	public GraphQLError singleError(
			DataFetchingEnvironment environment,
			String message,
			GraphQLErrorType errorType,
			GraphQLErrorCode code
	) {
		return buildError(environment, message, errorType, code, Map.of());
	}

	public GraphQLError constraintValidationError(
			DataFetchingEnvironment environment,
			ConstraintViolationException exception
	) {
		List<Map<String, Object>> violations = exception
						.getConstraintViolations()
						.stream()
						.map(this::constraintViolation)
						.toList();

		return buildError(
				environment,
				"Validation failed",
				GraphQLErrorType.BAD_REQUEST,
				GraphQLErrorCode.VALIDATION_ERROR,
				Map.of("violations", violations)
		);
	}

	public GraphQLError bindValidationError(
			DataFetchingEnvironment environment,
			BindException exception
	) {
		List<Map<String, Object>> violations = exception
						.getBindingResult()
						.getFieldErrors()
						.stream()
						.map(this::fieldViolation)
						.toList();

		return buildError(
				environment,
				"Validation failed",
				GraphQLErrorType.BAD_REQUEST,
				GraphQLErrorCode.VALIDATION_ERROR,
				Map.of("violations", violations)
		);
	}

	private Map<String, Object> constraintViolation(ConstraintViolation<?> violation) {
		return Map.of(
				"field", violation.getPropertyPath().toString(),
				"message", violation.getMessage()
		);
	}

	private Map<String, Object> fieldViolation(FieldError error) {
		return Map.of(
				"field", error.getField(),
				"message", resolveFieldErrorMessage(error)
		);
	}

	private String resolveFieldErrorMessage(FieldError error) {
		return error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage();
	}

	private GraphQLError buildError(
			DataFetchingEnvironment environment,
			String message,
			GraphQLErrorType errorType,
			GraphQLErrorCode code,
			Map<String, Object> extraExtensions
	) {
		Map<String, Object> extensions = new LinkedHashMap<>();
		extensions.put("errorType", errorType.name());
		extensions.put("code", code.name());
		extensions.putAll(extraExtensions);

		return GraphqlErrorBuilder.newError(environment)
					   .message(message)
					   .errorType(ErrorClassification.errorClassification(errorType.name()))
					   .extensions(extensions)
					   .build();
	}
}