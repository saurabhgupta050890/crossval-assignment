import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ItemInput } from "@/lib/validations";

type ItemRowProps = {
  index: number;
  item: ItemInput;
  onChange: (index: number, field: keyof ItemInput, value: string | number | undefined) => void;
  onRemove: (index: number) => void;
};

export function ItemRow({ index, item, onChange, onRemove }: ItemRowProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | undefined = value;
    
    if (type === "number") {
      parsedValue = value === "" ? undefined : parseFloat(value);
    }

    onChange(index, name as keyof ItemInput, parsedValue);
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-start border-b border-border/50 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <div className="col-span-12 md:col-span-4">
        <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Description</label>
        <Input
          name="description"
          placeholder="Item description"
          value={item.description}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-span-6 md:col-span-2">
        <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Quantity</label>
        <Input
          name="quantity"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Qty"
          value={item.quantity ?? ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-span-6 md:col-span-2">
        <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Unit Price</label>
        <Input
          name="unitPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={item.unitPrice === 0 && item.description === "" ? "" : item.unitPrice ?? ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-span-6 md:col-span-2">
        <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Discount (Optional)</label>
        <Input
          name="discount"
          type="text"
          placeholder="e.g. 10 or 10%"
          value={item.discount ?? ""}
          onChange={handleChange}
        />
      </div>
      <div className="col-span-4 md:col-span-1">
        <label className="text-xs font-medium text-muted-foreground mb-1 block md:hidden">Tax % (Opt)</label>
        <Input
          name="tax"
          type="number"
          min="0"
          step="0.01"
          placeholder="Tax %"
          value={item.tax ?? ""}
          onChange={handleChange}
        />
      </div>
      <div className="col-span-2 md:col-span-1 flex justify-end md:justify-center items-end md:items-center h-[40px] md:h-auto">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}
