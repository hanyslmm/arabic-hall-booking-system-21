import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  cardView?: boolean; // Force card view regardless of screen size
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string; // Label to show in card view
  hideInCard?: boolean; // Hide this cell in card view
  primary?: boolean; // Mark as primary cell (shown as card title)
}

interface ResponsiveTableHeadProps {
  children: React.ReactNode;
  className?: string;
}

// Context to pass down table state
const TableContext = React.createContext<{
  isCardView: boolean;
}>({
  isCardView: false,
});

export function ResponsiveTable({ 
  children, 
  className,
  cardView = false 
}: ResponsiveTableProps) {
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isCardView = cardView || isSmallScreen;

  return (
    <TableContext.Provider value={{ isCardView }}>
      {isCardView ? (
        <div className={cn("space-y-4", className)}>
          {children}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full caption-bottom text-sm", className)}>
            {children}
          </table>
        </div>
      )}
    </TableContext.Provider>
  );
}

export function ResponsiveTableHeader({ 
  children, 
  className 
}: ResponsiveTableHeaderProps) {
  const { isCardView } = React.useContext(TableContext);

  if (isCardView) {
    return null; // Headers are not shown in card view
  }

  return (
    <thead className={cn("[&_tr]:border-b", className)}>
      {children}
    </thead>
  );
}

export function ResponsiveTableBody({ 
  children, 
  className 
}: ResponsiveTableBodyProps) {
  const { isCardView } = React.useContext(TableContext);

  if (isCardView) {
    return <div className={cn("space-y-4", className)}>{children}</div>;
  }

  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

export function ResponsiveTableHead({ 
  children, 
  className 
}: ResponsiveTableHeadProps) {
  const { isCardView } = React.useContext(TableContext);

  if (isCardView) {
    return null;
  }

  return (
    <th
      className={cn(
        "h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
    >
      {children}
    </th>
  );
}

// Context for row data
const RowContext = React.createContext<{
  cells: Array<{
    label?: string;
    content: React.ReactNode;
    hideInCard?: boolean;
    primary?: boolean;
  }>;
  primaryCell?: React.ReactNode;
}>({
  cells: [],
});

export function ResponsiveTableRow({ 
  children, 
  className,
  onClick 
}: ResponsiveTableRowProps) {
  const { isCardView } = React.useContext(TableContext);
  const [cells, setCells] = React.useState<Array<{
    label?: string;
    content: React.ReactNode;
    hideInCard?: boolean;
    primary?: boolean;
  }>>([]);
  const [primaryCell, setPrimaryCell] = React.useState<React.ReactNode>(null);

  // Collect cell data
  React.useEffect(() => {
    const cellData: typeof cells = [];
    let primary: React.ReactNode = null;

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === ResponsiveTableCell) {
        const props = child.props as ResponsiveTableCellProps;
        if (props.primary) {
          primary = props.children;
        }
        cellData.push({
          label: props.label,
          content: props.children,
          hideInCard: props.hideInCard,
          primary: props.primary,
        });
      }
    });

    setCells(cellData);
    setPrimaryCell(primary);
  }, [children]);

  if (isCardView) {
    return (
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {primaryCell && (
            <div className="font-semibold text-lg mb-3">
              {primaryCell}
            </div>
          )}
          <div className="space-y-2">
            {cells
              .filter(cell => !cell.hideInCard && !cell.primary)
              .map((cell, index) => (
                <div key={index} className="flex justify-between items-start gap-2">
                  {cell.label && (
                    <span className="text-sm text-muted-foreground font-medium">
                      {cell.label}:
                    </span>
                  )}
                  <span className="text-sm text-left flex-1">
                    {cell.content}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <RowContext.Provider value={{ cells, primaryCell }}>
      <tr
        className={cn(
          "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {children}
      </tr>
    </RowContext.Provider>
  );
}

export function ResponsiveTableCell({ 
  children, 
  className,
  label,
  hideInCard = false,
  primary = false
}: ResponsiveTableCellProps) {
  const { isCardView } = React.useContext(TableContext);

  if (isCardView) {
    // Cell content is handled by the parent Row component
    return null;
  }

  return (
    <td
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        className
      )}
    >
      {children}
    </td>
  );
}