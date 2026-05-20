import React from 'react';
import classNames from 'classnames';

const Table = ({ tableInstance, className }) => {
    const { getTableProps, headerGroups, page, getTableBodyProps, prepareRow } = tableInstance;
    return (
        <table {...getTableProps()} className={className}>
            <thead>
                {headerGroups.map((headerGroup, i) => (
                    <tr key={i} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((col, ci) => (
                            <th
                                key={ci}
                                {...col.getHeaderProps(col.getSortByToggleProps())}
                                className={classNames(col.headerClassName, {
                                    sorting_desc: col.isSortedDesc,
                                    sorting_asc: col.isSorted && !col.isSortedDesc,
                                    sorting: col.sortable,
                                })}
                            >
                                {col.render('Header')}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {page.map((row, ri) => {
                    prepareRow(row);
                    return (
                        <tr key={ri} {...row.getRowProps()} className={ri % 2 === 0 ? 'even' : 'odd'}>
                            {row.cells.map((cell, ci) => (
                                <td key={ci} {...cell.getCellProps()} className={cell.column.cellClassName}>
                                    {cell.render('Cell')}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default Table;