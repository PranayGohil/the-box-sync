import React from 'react';
import classNames from 'classnames';

const Table = ({ tableInstance, className }) => {
    const { getTableProps, headerGroups, page, getTableBodyProps, prepareRow } = tableInstance;
    return (
        <>
            <table className={className} {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup, headerIndex) => (
                        <tr key={`header${headerIndex}`} {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column, index) => {
                                return (
                                    <th
                                        key={`th.${index}`}
                                        {...column.getHeaderProps(column.getSortByToggleProps())}
                                        className={classNames(column.headerClassName, {
                                            sorting_desc: column.isSortedDesc,
                                            sorting_asc: column.isSorted && !column.isSortedDesc,
                                            sorting: column.sortable,
                                        })}
                                    >
                                        {column.render('Header')}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {page.map((row, i) => {
                        prepareRow(row);
                        return (
                            <tr key={`tr.${i}`} {...row.getRowProps()} className={`${i % 2 === 0 ? 'even' : 'odd'}`}>
                                {row.cells.map((cell, cellIndex) => (
                                    <td key={`td.${cellIndex}`} {...cell.getCellProps()} className={cell.column.cellClassName}>
                                        {cell.render('Cell')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
};

export default Table;