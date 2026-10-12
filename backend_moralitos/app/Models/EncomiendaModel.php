<?php

namespace App\Models;

use CodeIgniter\Model;

class EncomiendaModel extends Model
{
    protected $table            = 'encomiendas';
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'codigo_rastreo',
        'remitente_id',
        'destinatario_id',
        'origen_id',
        'destino_id',
        'descripcion',
        'precio',
        'tipo_pago',
        'estado',
        'fecha_registro'
    ];

    public function obtenerTodas()
    {
        return $this->select('encomiendas.*, 
                             r.nombre_completo as remitente_nombre, 
                             r.ci_nit as remitente_ci, 
                             r.celular as remitente_celular, 
                             d.nombre_completo as destinatario_nombre, 
                             d.ci_nit as destinatario_ci, 
                             d.celular as destinatario_celular')
                    ->join('clientes r', 'r.id = encomiendas.remitente_id', 'left')
                    ->join('clientes d', 'd.id = encomiendas.destinatario_id', 'left')
                    ->orderBy('encomiendas.id', 'DESC')
                    ->findAll();
    }
}