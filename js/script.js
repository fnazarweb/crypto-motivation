document.getElementById("generate").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "Loading...";

  try {
    const response = await fetch("https://dummyjson.com/quotes/random");
    const data = await response.json();
    document.getElementById("post").value = data.quote;
    status.textContent = "Success";
  } catch (e) {
    status.textContent = "Error fetching quote";
    console.error("Error fetching quote", e.message);
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const postContent = document.getElementById("post").value;
  const status = document.getElementById("status");
  if (!postContent) {
    status.textContent = "No post to save!";
    return;
  }

  status.textContent = "Saving post...";
  try {
    await fetch(
      "https://script.google.com/macros/s/AKfycbwjzfKa7wmM2S9PJGUqYEKtfoS32mhRZmxGSQLbbHS9JOptt0LQc7GM6Ev-9YhyL8_S/exec",
      {
        method: "POST",
        body: JSON.stringify({ post: postContent, secret: "goodbye-spammer" }),
      },
    );
    document.getElementById("post").value = "";
    status.textContent = "Post saved!";
  } catch (e) {
    status.textContent = "Error saving post";
    console.error("Error saving post", e.message);
  }
});

let socket;

function connect() {
  socket = new WebSocket("wss://api.whitebit.com/ws");
  let prevPrice = null;

  document.getElementById("currency_status").textContent = "🟡Connecting...";
  document.getElementById("currency_status").className = "connecting";

  socket.onopen = () => {
    console.log("Connected to Whitebit API");
    document.getElementById("currency_status").textContent = "🟢Connected!";
    document.getElementById("currency_status").className = "connected";

    const message = {
      id: 1,
      method: "depth_subscribe",
      params: ["BTC_USDT", 1, "0"],
    };

    socket.send(JSON.stringify(message));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.method === "depth_update") {
      const price = parseFloat(data.params[1]?.bids?.[0]?.[0]);
      if (!price) return;

      if (prevPrice !== null) {
        const pricediff = price - prevPrice;

        const trend = pricediff > 0 ? "↑" : "↓";
        const trendStyle = pricediff > 0 ? "connected" : "disconnected";
        document.getElementById("trend").textContent = trend;
        document.getElementById("trend").className = trendStyle;
      }
      document.getElementById("price").textContent = `$${price}`;
      prevPrice = price;
    }
  };

  socket.onclose = (event) => {
    console.log("Disconnected form WhiteBit API: ", event);
    document.getElementById("currency_status").textContent = "🔴Disconnected";
    document.getElementById("currency_status").className = "disconnected";

    setTimeout(() => {
      //Reconnect after 3 seconds if disconnected
      connect();
    }, 3000);
  };

  socket.onerror = (error) => {
    console.error("Websocket error: ", error);
    document.getElementById("currency_status").textContent = "🔴Disconnected";
    document.getElementById("currency_status").className = "disconnected";
  };
}

connect();
