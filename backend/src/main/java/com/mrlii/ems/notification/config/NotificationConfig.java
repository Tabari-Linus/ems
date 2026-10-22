package com.mrlii.ems.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.Set;
import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@EnableRetry
public class NotificationConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-");
        executor.initialize();
        return executor;
    }

    @Bean(name = "emailTemplateEngine")
    public SpringTemplateEngine emailTemplateEngine() {
        ClassLoaderTemplateResolver htmlResolver = new ClassLoaderTemplateResolver();
        htmlResolver.setOrder(1);
        htmlResolver.setCheckExistence(true);
        htmlResolver.setResolvablePatterns(Set.of("*.html"));
        htmlResolver.setPrefix("templates/email/");
        htmlResolver.setTemplateMode(TemplateMode.HTML);
        htmlResolver.setCharacterEncoding("UTF-8");
        htmlResolver.setCacheable(true);

        ClassLoaderTemplateResolver textResolver = new ClassLoaderTemplateResolver();
        textResolver.setOrder(2);
        textResolver.setCheckExistence(true);
        textResolver.setResolvablePatterns(Set.of("*.txt"));
        textResolver.setPrefix("templates/email/");
        textResolver.setTemplateMode(TemplateMode.TEXT);
        textResolver.setCharacterEncoding("UTF-8");
        textResolver.setCacheable(true);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(htmlResolver);
        engine.addTemplateResolver(textResolver);
        return engine;
    }
}
