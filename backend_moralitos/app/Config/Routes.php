<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// Capturar todas las peticiones OPTIONS previas de CORS para la API
$routes->options('api/(:any)', function() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    exit(0);
});

// Grupo de Rutas API Explícitas
$routes->group('api', function($routes) {
    // Clientes
    $routes->get('clientes', 'Clientes::index');
    $routes->post('clientes', 'Clientes::create');
    $routes->get('clientes/buscar/(:any)', 'Clientes::buscar/$1');

    // Encomiendas
    $routes->get('encomiendas', 'Encomiendas::index');
    $routes->post('encomiendas', 'Encomiendas::create');
    $routes->get('encomiendas/rastrear/(:segment)', 'Encomiendas::rastrear/$1');
    $routes->put('encomiendas/actualizarEstado/(:segment)', 'Encomiendas::actualizarEstado/$1');
});