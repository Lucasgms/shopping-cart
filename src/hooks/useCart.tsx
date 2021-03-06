import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: product } = await api.get(`products/${productId}`);
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);
      

      if (product) {
        const productCart = cart.find(product => product.id === productId);

        if (productCart) {
          if (stock.amount > productCart.amount) {
            const newCart: Product[] = cart.map(product => {
              if (product.id === productId) {
                product.amount +=1;
              }

              return product;
            });

            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          if (stock.amount > 0) {
            const newProduct = {
              ...product,
              amount: 1,
            };
            
            const newCart = [...cart, newProduct];

            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        }
      }
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      if (cart.find(product => product.id === productId)) {
        const newCart = cart.filter(product => product.id !== productId);

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remo????o do produto');
      }
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);
      
      if (amount > 0) {
        if (stock.amount > 0 && stock.amount >= amount) {
          const newCart = cart.map(product => {
            if (product.id === productId) {
              product.amount = amount;
            }
  
            return product;
          })
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } 
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
