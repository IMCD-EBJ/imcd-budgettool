package com.IMCDBudgetTool.config;

import com.IMCDBudgetTool.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final Log logger = LogFactory.getLog(this.getClass());

    @Value("${commonsapp.url}")
    private String commonAppsUrl;

    private JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Extraer el jwt de la cookie "jwt"
        String jwt = jwtUtil.getJwtFromCookie(request);

        if(jwt == null) {
            // Si es un usuario no autenticado (no dispone de JWT), redirigir a la página principal de CommonApps
            response.sendRedirect(commonAppsUrl);
            return;
        }

        try {
            Claims claims = jwtUtil.getJwtClaims(jwt);

            // Extraer username y roles del JWT
            String username = claims.getSubject();
            logger.info("** JWT Authenticated user: " + username);

            if (username != null) {
                //TODO Arturo falta obtener los roles de la base de datos y asignarlos al usuario

                /*
                 * Por lo visto los roles se deben obtener en la base de datos/procedimiento almacenado
                 * en cuanto los obtengas, asignarlos a la variable "authorities" de la siguiente
                 * manera (reemplaza "ROLE_USER" por los que obtengas de la BD asigna el prefijo 'ROLE_'):
                 */
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
                UserDetails userDetails = new User(username, "", authorities);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

            } else {
                response.sendRedirect(commonAppsUrl);
            }

        } catch (Exception e) {
            logger.error("Error en el JWT: " + e.getMessage());
            response.sendRedirect(commonAppsUrl);
        }

        filterChain.doFilter(request, response);

    }


}

