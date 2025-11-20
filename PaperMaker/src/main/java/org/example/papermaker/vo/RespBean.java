package org.example.papermaker.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一响应结果封装类
 * 
 * @author System
 * @since 1.0.0
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "统一响应结果")
public class RespBean {
    
    @Schema(description = "响应状态码", example = "200")
    private long code;
    
    @Schema(description = "响应消息", example = "操作成功")
    private String message;
    
    @Schema(description = "响应数据")
    private Object object;
    //成功后返回带数据
    public static RespBean success(Object object){
        return new RespBean(RespBeanEnum.SUCCESS.getCode() , RespBeanEnum.SUCCESS.getMessage() , object);
    }
    //不带数据
    public static RespBean success(){
        return new RespBean(RespBeanEnum.SUCCESS.getCode() , RespBeanEnum.SUCCESS.getMessage() , null);
    }
    //失败不带数据
    public static RespBean error(RespBeanEnum respBeanEnum){
        return new RespBean(respBeanEnum.getCode(), respBeanEnum.getMessage(),  null);
    }
    //失败带数据
    public static RespBean error(RespBeanEnum respBeanEnum , Object object){
        return new RespBean(respBeanEnum.getCode(), respBeanEnum.getMessage(),  object);
    }
}
