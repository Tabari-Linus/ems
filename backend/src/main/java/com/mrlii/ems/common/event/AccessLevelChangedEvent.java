package com.mrlii.ems.common.event;

/**
 * Published after an access level's permissions, status or membership changed.
 * Authorization caches listen to it, so revocation is effective on the next request.
 */
public record AccessLevelChangedEvent(Long accessLevelId) {}
