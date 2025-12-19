package org.example.papermaker.controller;

import org.example.papermaker.annotation.RequireRole;
import org.example.papermaker.entity.UserEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 系统监控控制器
 * 仅系统管理员可访问，用于查看系统运行状态
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/system")
@CrossOrigin(originPatterns = "*")
@RequireRole(UserEntity.UserRole.ADMIN)
public class SystemMonitorController {

    private static final Logger log = LoggerFactory.getLogger(SystemMonitorController.class);

    /**
     * 获取系统概览信息
     */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getSystemOverview() {
        try {
            Map<String, Object> overview = new HashMap<>();

            // JVM信息
            RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
            overview.put("jvmName", runtimeMXBean.getVmName());
            overview.put("jvmVersion", runtimeMXBean.getVmVersion());
            overview.put("jvmVendor", runtimeMXBean.getVmVendor());
            overview.put("startTime", new Date(runtimeMXBean.getStartTime()));
            overview.put("uptime", formatUptime(runtimeMXBean.getUptime()));

            // 操作系统信息
            OperatingSystemMXBean osMXBean = ManagementFactory.getOperatingSystemMXBean();
            overview.put("osName", osMXBean.getName());
            overview.put("osVersion", osMXBean.getVersion());
            overview.put("osArch", osMXBean.getArch());
            overview.put("availableProcessors", osMXBean.getAvailableProcessors());
            overview.put("systemLoadAverage", osMXBean.getSystemLoadAverage());

            // 内存信息
            MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
            Map<String, Object> heapMemory = new HashMap<>();
            heapMemory.put("init", formatBytes(memoryMXBean.getHeapMemoryUsage().getInit()));
            heapMemory.put("used", formatBytes(memoryMXBean.getHeapMemoryUsage().getUsed()));
            heapMemory.put("committed", formatBytes(memoryMXBean.getHeapMemoryUsage().getCommitted()));
            heapMemory.put("max", formatBytes(memoryMXBean.getHeapMemoryUsage().getMax()));
            heapMemory.put("usedPercent",
                    Math.round(memoryMXBean.getHeapMemoryUsage().getUsed() * 100.0 /
                            memoryMXBean.getHeapMemoryUsage().getMax()));
            overview.put("heapMemory", heapMemory);

            Map<String, Object> nonHeapMemory = new HashMap<>();
            nonHeapMemory.put("init", formatBytes(memoryMXBean.getNonHeapMemoryUsage().getInit()));
            nonHeapMemory.put("used", formatBytes(memoryMXBean.getNonHeapMemoryUsage().getUsed()));
            nonHeapMemory.put("committed", formatBytes(memoryMXBean.getNonHeapMemoryUsage().getCommitted()));
            overview.put("nonHeapMemory", nonHeapMemory);

            // 当前时间
            overview.put("serverTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取系统概览成功");
            response.put("data", overview);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取系统概览失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取系统概览失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取JVM内存详细信息
     */
    @GetMapping("/memory")
    public ResponseEntity<Map<String, Object>> getMemoryInfo() {
        try {
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> memory = new HashMap<>();

            long maxMemory = runtime.maxMemory();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;

            memory.put("maxMemory", formatBytes(maxMemory));
            memory.put("totalMemory", formatBytes(totalMemory));
            memory.put("usedMemory", formatBytes(usedMemory));
            memory.put("freeMemory", formatBytes(freeMemory));
            memory.put("usedPercent", Math.round(usedMemory * 100.0 / maxMemory));

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取内存信息成功");
            response.put("data", memory);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取内存信息失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取内存信息失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取线程信息
     */
    @GetMapping("/threads")
    public ResponseEntity<Map<String, Object>> getThreadInfo() {
        try {
            Map<String, Object> threadInfo = new HashMap<>();

            ThreadGroup rootGroup = Thread.currentThread().getThreadGroup();
            while (rootGroup.getParent() != null) {
                rootGroup = rootGroup.getParent();
            }
            int activeCount = rootGroup.activeCount();

            threadInfo.put("activeThreads", activeCount);
            threadInfo.put("peakThreadCount", ManagementFactory.getThreadMXBean().getPeakThreadCount());
            threadInfo.put("totalStartedThreadCount", ManagementFactory.getThreadMXBean().getTotalStartedThreadCount());
            threadInfo.put("daemonThreadCount", ManagementFactory.getThreadMXBean().getDaemonThreadCount());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取线程信息成功");
            response.put("data", threadInfo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取线程信息失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取线程信息失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 触发垃圾回收（谨慎使用）
     */
    @PostMapping("/gc")
    public ResponseEntity<Map<String, Object>> triggerGC() {
        try {
            long beforeMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
            System.gc();
            Thread.sleep(500); // 等待GC完成
            long afterMemory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();

            Map<String, Object> gcResult = new HashMap<>();
            gcResult.put("beforeGC", formatBytes(beforeMemory));
            gcResult.put("afterGC", formatBytes(afterMemory));
            gcResult.put("freedMemory", formatBytes(beforeMemory - afterMemory));

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "垃圾回收已触发");
            response.put("data", gcResult);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("触发垃圾回收失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "触发垃圾回收失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 格式化字节数
     */
    private String formatBytes(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1024 * 1024)
            return String.format("%.2f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024)
            return String.format("%.2f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    /**
     * 格式化运行时间
     */
    private String formatUptime(long uptimeMs) {
        long seconds = uptimeMs / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        if (days > 0) {
            return String.format("%d天 %d小时 %d分钟", days, hours % 24, minutes % 60);
        } else if (hours > 0) {
            return String.format("%d小时 %d分钟", hours, minutes % 60);
        } else {
            return String.format("%d分钟", minutes);
        }
    }
}
