import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WalletFileUploadProps {
  onWalletsImported: (wallets: { publicKey: string; privateKey: string }[]) => void;
}

const WalletFileUpload = ({ onWalletsImported }: WalletFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      let wallets: { publicKey: string; privateKey: string }[] = [];

      if (file.name.endsWith('.json')) {
        wallets = JSON.parse(text);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        wallets = text.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [publicKey, privateKey] = line.split(',').map(s => s.trim());
            return { publicKey, privateKey };
          });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast({
          title: "Excel Support Coming Soon",
          description: "Excel file support will be added in a future update.",
          variant: "destructive",
        });
        return;
      }

      if (wallets.length === 0) {
        throw new Error("No valid wallet data found in file");
      }

      onWalletsImported(wallets);
      toast({
        title: "Success",
        description: `Imported ${wallets.length} wallets`,
      });
    } catch (error: any) {
      console.error("File processing error:", error);
      toast({
        title: "Error Processing File",
        description: error.message || "Failed to process wallet file",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.txt,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  }, []);

  return (
    <Card
      className={`p-4 border-2 border-dashed cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-border'
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
    >
      <div className="flex items-center justify-center gap-2 text-center">
        <Upload className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop file or click to upload
        </p>
      </div>
    </Card>
  );
};

export default WalletFileUpload;