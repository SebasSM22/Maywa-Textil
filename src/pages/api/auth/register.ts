import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      nombre,
      apellido,
      dni,
      telefono,
      sexo,
      id_provincia,
      correo,
      contrasena,
    } = body;

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: "Error en Supabase Auth", detail: authError.message }),
        { status: 400 }
      );
    }

    const authUser = authData.user;

    // 2. Insertar en tb_persona
    const { data: persona, error: errorPersona } = await supabase
      .from("tb_persona")
      .insert([
        { nombre, apellido, dni, telefono, sexo, id_provincia }
      ])
      .select("id_persona")
      .single();

    if (errorPersona) {
      return new Response(
        JSON.stringify({ error: "Error al registrar persona", detail: errorPersona.message }),
        { status: 400 }
      );
    }

    // 3. Insertar en tb_usuario (enlazado a persona, ya sin contraseña)
    const { error: errorUsuario } = await supabase
      .from("tb_usuario")
      .insert([
        {
          id_persona: persona.id_persona,
          correo,
          id_rol: null, // opcional
        },
      ]);

    if (errorUsuario) {
      return new Response(
        JSON.stringify({ error: "Error al registrar usuario extra", detail: errorUsuario.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Usuario registrado con éxito ✅", user: authUser }),
      { status: 201 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Error en el servidor", detail: err.message }),
      { status: 500 }
    );
  }
};