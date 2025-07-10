import React, {
  createContext,
  useContext,
  useRef,
  MutableRefObject,
} from 'react';

interface KitchenContextType {
  refetchRef: MutableRefObject<(() => void) | null>;
}

const KitchenContext = createContext<KitchenContextType | undefined>(undefined);

export const KitchenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const refetchRef = useRef<(() => void) | null>(null);

  return (
    <KitchenContext.Provider value={{ refetchRef }}>
      {children}
    </KitchenContext.Provider>
  );
};

export const useKitchenContext = () => {
  const context = useContext(KitchenContext);
  if (!context) {
    throw new Error('useKitchenContext must be used within a KitchenProvider');
  }
  return context;
};
