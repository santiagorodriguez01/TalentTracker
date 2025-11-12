'use client';
import * as React from 'react';
import { DataGrid, GridColDef, GridPaginationModel, GridRowIdGetter } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export default function DataTable({ rows, columns, loading, page, pageSize, rowCount, onPageChange, getRowId, onRowClick, onCellKeyDown }: {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  page: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (m: GridPaginationModel)=>void;
  getRowId?: GridRowIdGetter<any>;
  onRowClick?: (params: any)=>void;
  onCellKeyDown?: (params: any, event: any)=>void;
}){
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <div style={{ width: '100%', height: 'calc(100dvh - 216px)' }}>
      <DataGrid
        getRowId={getRowId}
        loading={loading}
        rows={rows}
        columns={columns}
        pageSizeOptions={[25, 50, 100]}
        pagination
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={onPageChange}
        rowCount={rowCount}
        paginationMode="server"
        disableColumnMenu
        density={isSmall ? 'compact' : 'standard'}
        onRowClick={onRowClick}
        onCellKeyDown={onCellKeyDown as any}
        rowHeight={isSmall ? 36 : undefined}
        columnHeaderHeight={isSmall ? 40 : undefined}
        sx={{
          '& .MuiDataGrid-withBorderColor': { borderColor: 'divider' },
          ...(isSmall ? {
            '& .MuiDataGrid-cell': { fontSize: '0.92rem', lineHeight: 1.25, py: 0.25 },
            '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.92rem', lineHeight: 1.2 },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
          } : {})
        }}
      />
    </div>
  );
}
