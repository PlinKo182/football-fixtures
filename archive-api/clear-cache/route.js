import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    // Limpar cache da página principal
    revalidatePath('/');
    
    console.log('🔄 Cache da página principal foi invalidado');
    
    return NextResponse.json({
      success: true,
      message: 'Cache invalidado com sucesso',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao invalidar cache:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}