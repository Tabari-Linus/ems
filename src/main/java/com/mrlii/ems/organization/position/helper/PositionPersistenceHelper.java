package com.mrlii.ems.organization.position.helper;

import com.mrlii.ems.common.enums.CommonStatus;
import com.mrlii.ems.common.util.CommonUtilHelper;
import com.mrlii.ems.organization.position.dto.CreatePositionInput;
import com.mrlii.ems.organization.position.dto.UpdatePositionInput;
import com.mrlii.ems.organization.position.entity.Position;
import com.mrlii.ems.organization.position.repository.PositionRepository;
import com.mrlii.ems.organization.position.util.PositionValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PositionPersistenceHelper {

    private final PositionRepository positionRepository;
    private final PositionValidator validator;
    private final CommonUtilHelper commonUtilHelper;

    public Position create(CreatePositionInput input) {
        validator.validateNameIsUnique(input.positionName());

        Position position = Position.builder()
                .positionName(commonUtilHelper.normalizeName(input.positionName()))
                .level(input.level())
                .description(input.description())
                .status(CommonStatus.ACTIVE)
                .build();

        return positionRepository.save(position);
    }

    public Position update(Long id, UpdatePositionInput input) {
        Position position = validator.findByIdOrThrow(id);

        if (input.positionName() != null && !input.positionName().isBlank()) {
            validator.validateNameIsUniqueForUpdate(id, input.positionName());
            position.setPositionName(commonUtilHelper.normalizeName(input.positionName()));
        }
        if (input.level() != null) {
            position.setLevel(input.level());
        }
        if (input.description() != null) {
            position.setDescription(input.description());
        }

        return positionRepository.save(position);
    }

    public Position activate(Long id) {
        Position position = validator.findByIdOrThrow(id);
        position.setStatus(CommonStatus.ACTIVE);
        return positionRepository.save(position);
    }

    public Position archive(Long id) {
        Position position = validator.findByIdOrThrow(id);
        position.setStatus(CommonStatus.ARCHIVED);
        return positionRepository.save(position);
    }

    public void softDelete(Long id) {
        Position position = validator.findByIdOrThrow(id);
        position.setStatus(CommonStatus.ARCHIVED);
        position.setDeletedAt(commonUtilHelper.getCurrentDateTime());
        positionRepository.save(position);
    }
}
