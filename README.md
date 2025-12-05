# PoolGame
# Simulación de Billar en Three.js + Ammo.js + TWEEN

En esta práctica se ha simulado un juego de billar en 3D utilizando:

- **Three.js** para el renderizado del entorno
- **Ammo.js** como motor físico encargado de las colisiones
- **TWEEN** para la animación del tiro del jugador

Enlace al vídeo de youtube:

---

## Mesa del Billar

Para la mesa se han desarrollado dos partes:

### Física de la mesa
Mediante la función **`createTable()`** se generan los bordes físicos que sirven como límite del área de juego.

### Modelo visual
Con la función **`loadTable()`** se carga un **modelo 3D de la mesa**, el cual se superpone sobre la estructura física para mejorar el realismo visual.

---

## Agujeros (Bolsillos)

Los agujeros fueron creados utilizando **cilindros invisibles**.  
Si una bola está a una distancia cercana al radio de un cilindro:

- La bola **desaparece**
- La bola embocada **aparecerá en el lateral izquierdo de la pantalla**
- En caso de ser la **bola blanca**, reaparecerá en su **posición inicial**

Esto permite simular correctamente el juego.

---

## Bolas del Billar

Con la función **`createBalls()`** se generan todas las bolas necesarias.

Mejoras aplicadas:

✔ Cuerpos físicos reales  
✔ Colisiones entre bolas mediante Ammo.js  
✔ Texturas para identificar cada bola  
✔ Posición inicial basada en un triángulo de salida típico

---

## Palo del Billar (Taco)

La función **`createStick()`** genera y muestra el palo del billar.  
Este palo se mantiene siempre **alineado y rotando alrededor de la bola blanca** mediante la función **`positionStick()`**.

El tiro se simula con **TWEEN**, desplazando el palo hacia adelante y transmitiendo impulso a la bola.

---

## Fondo del Escenario

Se ha añadido un entorno de fondo con la función **`addBackground()`**, importando un **modelo 3D** externo para dar ambientación a la escena.

Todos los modelos 3D utilizados se almacenan en un **repositorio de GitHub** debido a su tamaño y se cargan desde enlaces directos.

---

## Controles y Eventos

| Acción | Control |
|-------|---------|
| Mover la cámara libremente | Ratón (click + arrastar) |
| Disparar la bola blanca | Tecla **E** |
| Reiniciar la partida | Tecla **R** |
| Vista superior de la mesa | Botón en pantalla |
| Ajustar fuerza del disparo | Slider de potencia |

Estos eventos permiten interactuar con la escena de forma intuitiva y jugar una partida completa.

---

