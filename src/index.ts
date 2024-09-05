import express from "express";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import qs from "qs";
import { PrismaClient } from "@prisma/client";
import { MessageSource } from "./constants";

require("dotenv").config();
const port = process.env.PORT || 8080;
const app = express();
const prisma = new PrismaClient();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_KEY;
const client = require("twilio")(accountSid, authToken);
const whatsappNumber = process.env.WHATSAPP_NUMBER;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/whatsapp-webhook", async (req, res) => {
  try {
    const incomingMessage: string = req.body.Body;
    const fromNumber = extractPhoneNumber(req.body.From);
    await receivedMessage(incomingMessage, fromNumber, MessageSource.whatsapp);
    res.status(200).send("Message received from whatsapp");
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/mobile-chat", async (req, res) => {
  try {
    const { message, phoneNumber } = req.body;
    const fromNumber = extractPhoneNumber(phoneNumber);
    await receivedMessage(message, fromNumber, MessageSource.mobile);
    res.status(200).send("Message received from mobile");
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.post("/send-whatsapp-message", async (req, res) => {
  try {
    const { to, message, step, isFinal } = req.body;
    const toNumber = extractPhoneNumber(to);
    const savedMessage = await prisma.message.findFirst({
      where: {
        from: toNumber,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (savedMessage?.source === MessageSource.whatsapp) {
      const messageBody = {
        body: message,
        from: whatsappPhoneNumber(whatsappNumber!),
        to: whatsappPhoneNumber(to),
      };
      const sentMessage = await client.messages.create(messageBody);
      await prisma.message.create({
        data: {
          from: whatsappNumber!,
          to: toNumber,
          message,
          messageSid: sentMessage.sid,
          step,
          isFinal: isFinal ? isFinal : false,
          source: savedMessage.source,
        },
      });
    } else {
      await sendNotification({ message, phoneNumber: toNumber });
    }

    res.status(200).send("Message sent");
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

app.get("/get-chats/:id", async (req, res) => {
  try {
    const phoneNumber = req.params.id;
    const messages = await prisma.message.findMany({
      where: {
        to: phoneNumber,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        from: true,
        to: true,
        message: true,
      },
    });
    res.status(200).json(messages);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const receivedMessage = async (
  incomingMessage: string,
  fromNumber: string,
  source: string
) => {
  const { initial, step, isCommand } = await getQuestionnaireDetails(
    fromNumber
  );

  const params = {
    message: isCommand ? incomingMessage.toLowerCase() : incomingMessage,
    initial,
    step,
  };

  const requestBody = {
    To: whatsappNumber,
    From: fromNumber,
    Parameters: JSON.stringify(params),
  };

  console.log(requestBody);

  await prisma.message.create({
    data: {
      from: fromNumber,
      to: whatsappNumber!,
      message: incomingMessage,
      source,
    },
  });

  await sendMessageToFlow(requestBody);
};

const extractPhoneNumber = (input: string): string => {
  const match = input.match(/(\d+)/);
  if (!match) {
    return "";
  }
  const phoneNumber = "+" + match[0];
  return phoneNumber.trim();
};

const whatsappPhoneNumber = (input: string): string => {
  return `whatsapp:${input.trim()}`;
};

const sendMessageToFlow = async (data: {
  To: string | undefined;
  From: string;
  Parameters: string;
}) => {
  const username = process.env.TWILIO_SID;
  const password = process.env.TWILIO_KEY;
  const authToken = Buffer.from(`${username}:${password}`).toString("base64");
  const url = process.env.TWILIO_FLOW_URL;
  try {
    const response = await axios.post(url!, qs.stringify(data), {
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error making POST request:", error.message);
    throw error;
  }
};

const sendNotification = async (data: {
  message: string;
  phoneNumber: string;
}) => {
  await axios.post(`${process.env.APP_BASE_URL}/api/sendNotification`, data);
};

const subtractDateTimeInMinutes = (date1: Date, date2: Date): number => {
  const diffInMs: number = date1.getTime() - date2.getTime();

  const diffInMinutes: number = diffInMs / (1000 * 60);

  return diffInMinutes;
};

const getQuestionnaireDetails = async (
  fromNumber: string
): Promise<{
  initial: boolean;
  step: Number;
  isCommand: boolean;
}> => {
  const lastMessage = await prisma.message.findFirst({
    where: {
      to: fromNumber,
      step: {
        gt: 0,
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  if (lastMessage) {
    const { step, createdAt, isCommand, isFinal } = lastMessage;
    const minutes = subtractDateTimeInMinutes(new Date(), createdAt);
    let initial = true;
    if (!isFinal) {
      if (minutes <= 30) {
        initial = false;
      }
    }
    return { initial, step: step, isCommand };
  }

  return { initial: true, step: 0, isCommand: false };
};
