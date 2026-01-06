/**
 * Marketing Options Online - WebGL Hero Background
 * Animated diagonal light rays effect with blue/cyan color scheme
 */

(function() {
  'use strict';

  let canvas, gl, program;
  let resolutionLocation, timeLocation;
  let animationId;

  function init() {
    const bgContainer = document.querySelector('.webgl-background');
    if (!bgContainer) return;

    canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    // Try to get WebGL context
    gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      // WebGL not supported - show fallback
      document.body.classList.add('webgl-failed');
      console.warn('WebGL not supported, using fallback');
      return;
    }

    // WebGL supported - hide fallback shapes
    document.body.classList.add('webgl-active');

    // Compile shaders and create program
    if (!setupShaders()) {
      document.body.classList.remove('webgl-active');
      document.body.classList.add('webgl-failed');
      return;
    }

    // Set up geometry
    setupGeometry();

    // Handle resize
    resize();
    window.addEventListener('resize', debounce(resize, 100));

    // Start animation
    requestAnimationFrame(render);
  }

  function setupShaders() {
    // Vertex Shader
    const vertexShaderSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `;

    // Fragment Shader - Creates animated blue/cyan light rays
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      // Noise function for organic movement
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 4; i++) {
          value += amplitude * smoothNoise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;

        // Create multiple diagonal light rays
        float rays = 0.0;

        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float angle = 0.6 + fi * 0.12;
          float speed = 0.2 + fi * 0.08;

          // Rotate UV for diagonal rays
          vec2 rotatedUV = vec2(
            uv.x * cos(angle) - uv.y * sin(angle),
            uv.x * sin(angle) + uv.y * cos(angle)
          );

          // Animate position
          float offset = u_time * speed + fi * 0.6;

          // Create ray with noise
          float ray = fbm(vec2(rotatedUV.x * 1.5 + offset, rotatedUV.y * 0.3 + fi * 0.2));
          ray = pow(ray, 2.5) * (0.25 + fi * 0.08);

          rays += ray;
        }

        // Clamp rays intensity
        rays = clamp(rays, 0.0, 1.0);

        // Blue/Cyan color scheme
        vec3 color = vec3(0.05, 0.3, 0.7) * rays;  // Deep blue base
        color += vec3(0.0, 0.5, 0.8) * rays * 0.6;  // Cyan mid-tones
        color += vec3(0.2, 0.6, 0.9) * pow(rays, 2.0) * 0.4;  // Bright highlights

        // Add subtle color variation
        float colorShift = smoothNoise(uv * 3.0 + u_time * 0.1);
        color += vec3(0.0, 0.1, 0.15) * colorShift * rays;

        // Vignette effect - fade edges
        float vignette = 1.0 - length((uv - 0.5) * vec2(1.2, 1.0));
        vignette = smoothstep(0.0, 0.8, vignette);
        color *= vignette;

        // Fade bottom edge more aggressively
        float bottomFade = smoothstep(0.0, 0.3, uv.y);
        color *= bottomFade;

        // Slight top fade
        float topFade = smoothstep(1.0, 0.85, uv.y);
        color *= topFade;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
      return false;
    }

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return false;
    }

    // Create and link program
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);

    // Get uniform locations
    resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    timeLocation = gl.getUniformLocation(program, 'u_time');

    return true;
  }

  function setupGeometry() {
    // Fullscreen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  }

  function resize() {
    if (!canvas || !gl) return;

    // Use viewport dimensions for fixed positioning
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth * pixelRatio;
    const height = window.innerHeight * pixelRatio;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function render(time) {
    if (!gl || !program) return;

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, time * 0.0004); // Reduced speed (40% of original)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationId = requestAnimationFrame(render);
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Clean up on page unload
  function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  window.addEventListener('beforeunload', cleanup);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
